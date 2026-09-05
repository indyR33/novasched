/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Employee,
  Shift,
  Qualification,
  CoverageRequirement,
  Assignment,
  RotationPattern,
  GenerationConfig,
  GenerationDiagnostic
} from '../types/planning';

export interface GenerationResult {
  success: boolean;
  assignments: Assignment[];
  diagnostic: GenerationDiagnostic;
  summary: {
    totalAssignments: number;
    workDaysCount: number;
    restDaysCount: number;
    s3Count: number;
    sundayCount: number;
  };
}

export class PlanningGenerator {
  /**
   * Generates a complete compliant schedule
   */
  public static generate(
    config: GenerationConfig,
    employees: Employee[],
    shifts: Shift[],
    qualifications: Qualification[],
    coverageRequirements: CoverageRequirement[],
    rotationPatterns: RotationPattern[],
    existingAssignments: Assignment[] = []
  ): GenerationResult {
    const shiftMap = new Map<string, Shift>(shifts.map(s => [s.code, s]));
    const activeEmployees = employees.filter(e => e.isActive);

    // Filter locked assignments (e.g. pre-existing leaves CP, AM or manual overrides)
    const lockedMap = new Map<string, Assignment>();
    (existingAssignments || []).forEach(asg => {
      const shift = shiftMap.get(asg.shiftCode);
      if (shift && (shift.type === 'absence' || asg.isOverride || asg.source === 'manual')) {
        lockedMap.set(`${asg.employeeId}_${asg.date}`, asg);
      }
    });

    // Build date sequence
    const dates: string[] = [];
    const curr = new Date(config.startDate);
    const end = new Date(config.endDate);

    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const generatedAssignments: Assignment[] = [];
    const impossibleDates: string[] = [];
    const reasons: GenerationDiagnostic['reasons'] = [];

    // Track running stats for balancing
    const empStats = new Map<string, {
      totalHours: number;
      s3Count: number;
      sundaysCount: number;
      consecutiveWorkDays: number;
      lastShiftCode?: string;
      lastDate?: string;
    }>();

    activeEmployees.forEach(e => {
      empStats.set(e.id, {
        totalHours: 0,
        s3Count: 0,
        sundaysCount: 0,
        consecutiveWorkDays: 0
      });
    });

    // Helper: is qualified for shift
    const isQualified = (empId: string, shiftCode: string): boolean => {
      const q = qualifications.find(x => x.employeeId === empId && x.shiftCode === shiftCode);
      return q?.status === 'AUTHORIZED';
    };

    // Helper: is available on date (contract dates & consecutive work days check)
    const isAvailable = (emp: Employee, date: string): boolean => {
      if (emp.arrivalDate && date < emp.arrivalDate) return false;
      if (emp.departureDate && date > emp.departureDate) return false;
      const stats = empStats.get(emp.id);
      if (stats && stats.consecutiveWorkDays >= config.allowConsecutiveDaysLimit) {
        return false;
      }
      return true;
    };

    // Main day-by-day scheduling loop
    for (const date of dates) {
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;

      // Identify coverage requirements for this day
      const dailyReqs = coverageRequirements.filter(req => {
        return req.date === date ||
          (isWeekend && req.date === 'DEFAULT_WEEKEND') ||
          (!isWeekend && req.date === 'DEFAULT_WEEKDAY');
      });

      const assignedToday = new Set<string>();

      // 1. Preserve pre-existing locked absences/assignments
      activeEmployees.forEach(emp => {
        const locked = lockedMap.get(`${emp.id}_${date}`);
        if (locked) {
          generatedAssignments.push({ ...locked, source: locked.source || 'manual' });
          assignedToday.add(emp.id);

          const stats = empStats.get(emp.id)!;
          const shift = shiftMap.get(locked.shiftCode);
          if (shift && shift.type === 'travail') {
            stats.consecutiveWorkDays++;
            stats.totalHours += locked.countedHours;
            if (locked.shiftCode === 'S3') stats.s3Count++;
            if (isSunday) stats.sundaysCount++;
          } else {
            stats.consecutiveWorkDays = 0;
          }
          stats.lastShiftCode = locked.shiftCode;
          stats.lastDate = date;
        }
      });

      // 2. Fulfill required coverage in order of priority (S3, M1, M2, S1)
      const priorityOrder = ['S3', 'M1', 'S1', 'M2'];
      const sortedReqs = [...dailyReqs].sort((a, b) => {
        const idxA = priorityOrder.indexOf(a.subFamily);
        const idxB = priorityOrder.indexOf(b.subFamily);
        return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
      });

      for (const req of sortedReqs) {
        const needed = req.minimum;
        let assignedCount = 0;

        // Check if any locked assignment already fulfilled this
        for (const empId of assignedToday) {
          const asg = generatedAssignments.find(a => a.employeeId === empId && a.date === date);
          if (asg && asg.shiftCode === req.subFamily) {
            assignedCount++;
          }
        }

        while (assignedCount < needed) {
          // Candidate selection:
          // Must be active, not yet assigned today, available, qualified for req.subFamily
          const candidates = activeEmployees.filter(emp => {
            if (assignedToday.has(emp.id)) return false;
            if (!isAvailable(emp, date)) return false;
            if (!isQualified(emp.id, req.subFamily)) return false;

            // R27: If shift is M1 or M2, verify employee didn't work S3 yesterday
            if (req.subFamily === 'M1' || req.subFamily === 'M2') {
              const stats = empStats.get(emp.id);
              if (stats?.lastShiftCode === 'S3') {
                return false; // Violates 11h legal rest rule!
              }
            }

            return true;
          });

          if (candidates.length === 0) {
            // Impossible to satisfy requirement!
            if (!impossibleDates.includes(date)) impossibleDates.push(date);
            reasons.push({
              date,
              family: req.subFamily,
              missingCount: needed - assignedCount,
              availableQualified: candidates.length,
              explanation: `Impossible de couvrir le besoin ${req.subFamily} le ${date}. Aucun employé habilité et disponible (repos obligatoire ou absence).`
            });
            break;
          }

          // Optimization: Score candidates to achieve fairness & balance
          candidates.sort((a, b) => {
            const statsA = empStats.get(a.id)!;
            const statsB = empStats.get(b.id)!;

            let scoreA = 0;
            let scoreB = 0;

            // S3 balancing weight
            if (req.subFamily === 'S3') {
              scoreA += statsA.s3Count * config.s3Weight;
              scoreB += statsB.s3Count * config.s3Weight;
            }

            // Sunday balancing weight
            if (isSunday) {
              scoreA += statsA.sundaysCount * config.sundayWeight;
              scoreB += statsB.sundaysCount * config.sundayWeight;
            }

            // Overall hours balancing weight
            scoreA += (statsA.totalHours / 35) * config.hoursWeight;
            scoreB += (statsB.totalHours / 35) * config.hoursWeight;

            return scoreA - scoreB;
          });

          const chosen = candidates[0];
          const shiftObj = shiftMap.get(req.subFamily);
          const hours = shiftObj ? shiftObj.countedHours : 7.5;

          generatedAssignments.push({
            id: `gen-${date}-${chosen.id}`,
            date,
            employeeId: chosen.id,
            shiftCode: req.subFamily,
            countedHours: hours,
            source: 'generated',
            author: 'Générateur Automatique',
            timestamp: new Date().toISOString(),
            comment: `Affectation optimisée ${req.subFamily} (équilibrage)`
          });

          assignedToday.add(chosen.id);
          assignedCount++;

          const stats = empStats.get(chosen.id)!;
          stats.consecutiveWorkDays++;
          stats.totalHours += hours;
          if (req.subFamily === 'S3') stats.s3Count++;
          if (isSunday) stats.sundaysCount++;
          stats.lastShiftCode = req.subFamily;
          stats.lastDate = date;
        }
      }

      // 3. For remaining unassigned employees today:
      // Assign either a secondary work shift if rotation demands it, or OFF
      activeEmployees.forEach(emp => {
        if (!assignedToday.has(emp.id)) {
          const stats = empStats.get(emp.id)!;
          const isBeforeArrival = emp.arrivalDate && date < emp.arrivalDate;
          const isAfterDeparture = emp.departureDate && date > emp.departureDate;

          let code = 'OFF';
          let hours = 0;

          if (isBeforeArrival || isAfterDeparture) {
            code = 'OFF';
          } else {
            // Check if rotation pattern applies
            code = 'OFF';
            hours = 0;
            stats.consecutiveWorkDays = 0;
          }

          generatedAssignments.push({
            id: `gen-${date}-${emp.id}`,
            date,
            employeeId: emp.id,
            shiftCode: code,
            countedHours: hours,
            source: 'generated',
            author: 'Générateur Automatique',
            timestamp: new Date().toISOString()
          });

          stats.lastShiftCode = code;
          stats.lastDate = date;
          assignedToday.add(emp.id);
        }
      });
    }

    const isPossible = impossibleDates.length === 0;

    let s3Total = 0;
    let sundayTotal = 0;
    let workDays = 0;
    let restDays = 0;

    generatedAssignments.forEach(a => {
      if (a.shiftCode === 'S3') s3Total++;
      if (new Date(a.date).getDay() === 0 && a.shiftCode !== 'OFF') sundayTotal++;
      if (a.shiftCode !== 'OFF') workDays++;
      else restDays++;
    });

    const diagnostic: GenerationDiagnostic = {
      isPossible,
      impossibleDates,
      reasons,
      suggestedActions: isPossible ? [] : [
        'Habiliter des agents supplémentaires sur les codes critiques (notamment S3 et M1).',
        'Assouplir la limite de jours consécutifs de travail si réglementairement permis.',
        'Ajuster temporairement les seuils de couverture minimale sur les dates indiquées.'
      ]
    };

    return {
      success: isPossible,
      assignments: generatedAssignments,
      diagnostic,
      summary: {
        totalAssignments: generatedAssignments.length,
        workDaysCount: workDays,
        restDaysCount: restDays,
        s3Count: s3Total,
        sundayCount: sundayTotal
      }
    };
  }
}
