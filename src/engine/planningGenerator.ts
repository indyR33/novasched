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
    rotationAdherencePercentage?: number;
    rotationAppliedCount?: number;
    rotationAdjustmentsCount?: number;
    appliedRotationPatternName?: string;
  };
}

export class PlanningGenerator {
  /**
   * Generates a complete compliant schedule prioritizing rotation patterns
   * while strictly respecting all legal & contract constraints (HARD) and coverage minimums.
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

    // Sort employees deterministically (by team, matricule, name) to ensure predictable phase staggering
    activeEmployees.sort((a, b) => {
      if (a.team !== b.team) return a.team.localeCompare(b.team);
      if (a.matricule !== b.matricule) return a.matricule.localeCompare(b.matricule);
      return a.lastName.localeCompare(b.lastName);
    });

    // 1. Identify selected rotation pattern
    const applyRotation = config.respectRotations !== false && rotationPatterns && rotationPatterns.length > 0;
    let selectedPattern: RotationPattern | undefined;
    if (applyRotation) {
      if (config.selectedRotationPatternId) {
        selectedPattern = rotationPatterns.find(p => p.id === config.selectedRotationPatternId);
      }
      if (!selectedPattern) {
        selectedPattern = rotationPatterns.find(p => p.isActive);
      }
      if (!selectedPattern) {
        selectedPattern = rotationPatterns[0];
      }
    }

    // 2. Filter locked pre-existing assignments (absences CP, AM or manual overrides)
    const lockedMap = new Map<string, Assignment>();
    (existingAssignments || []).forEach(asg => {
      const shift = shiftMap.get(asg.shiftCode);
      if (shift && (shift.type === 'absence' || asg.isOverride || asg.source === 'manual')) {
        lockedMap.set(`${asg.employeeId}_${asg.date}`, asg);
      }
    });

    // 3. Build dates sequence
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

    let rotationAppliedCount = 0;
    let rotationAdjustmentsCount = 0;

    // Track running stats for workload balancing and constraint checking
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

    // Helper: is qualified for shift (R01)
    const isQualified = (empId: string, shiftCode: string): boolean => {
      const q = qualifications.find(x => x.employeeId === empId && x.shiftCode === shiftCode);
      return q?.status === 'AUTHORIZED';
    };

    // Helper: find alternative authorized shift in the same family (R01 adaptation)
    const findAuthorizedShiftInFamily = (empId: string, family: string, preferredSubFamily?: string): Shift | null => {
      const familyShifts = shifts.filter(s => s.family === family && s.isActive && s.type === 'travail');
      if (preferredSubFamily) {
        const direct = familyShifts.find(s => s.code === preferredSubFamily && isQualified(empId, s.code));
        if (direct) return direct;
      }
      for (const s of familyShifts) {
        if (isQualified(empId, s.code)) return s;
      }
      return null;
    };

    // Helper: is available on date (contract dates & consecutive work days check)
    const isContractActive = (emp: Employee, date: string): boolean => {
      if (emp.arrivalDate && date < emp.arrivalDate) return false;
      if (emp.departureDate && date > emp.departureDate) return false;
      return true;
    };

    // 4. Calculate Phase Offsets for Rotation (Roulement échelonné)
    const empOffsets = new Map<string, number>();
    if (selectedPattern && selectedPattern.steps && selectedPattern.steps.length > 0) {
      const cycleLen = selectedPattern.cycleLength || selectedPattern.steps.length;
      const staggerMode = config.rotationStaggerMode || 'EMPLOYEE_STAGGERED';

      if (staggerMode === 'TEAM_STAGGERED') {
        const teams = Array.from(new Set(activeEmployees.map(e => e.team)));
        const teamBaseOffset = new Map<string, number>();
        teams.forEach((tName, tIdx) => {
          const base = Math.floor((tIdx * cycleLen) / Math.max(1, teams.length));
          teamBaseOffset.set(tName, base);
        });
        const teamCounter = new Map<string, number>();
        activeEmployees.forEach(emp => {
          const base = teamBaseOffset.get(emp.team) || 0;
          const idxInTeam = teamCounter.get(emp.team) || 0;
          teamCounter.set(emp.team, idxInTeam + 1);
          empOffsets.set(emp.id, (base + idxInTeam) % cycleLen);
        });
      } else if (staggerMode === 'UNIFORM') {
        activeEmployees.forEach(emp => empOffsets.set(emp.id, 0));
      } else {
        // EMPLOYEE_STAGGERED (default): smooth distribution across the entire cycle
        activeEmployees.forEach((emp, idx) => {
          empOffsets.set(emp.id, idx % cycleLen);
        });
      }
    }

    // =========================================================================
    // MAIN DAY-BY-DAY SCHEDULING ENGINE
    // =========================================================================
    dates.forEach((date, dayIndex) => {
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
      // Track map of assignments created today for potential adjustments
      const todaysAssignments = new Map<string, Assignment>();

      // -----------------------------------------------------------------------
      // STEP 1: PRESERVE LOCKED ASSIGNMENTS (Absences CP/AM or Manual Overrides)
      // -----------------------------------------------------------------------
      activeEmployees.forEach(emp => {
        const locked = lockedMap.get(`${emp.id}_${date}`);
        if (locked) {
          generatedAssignments.push({ ...locked, source: locked.source || 'manual' });
          assignedToday.add(emp.id);
          todaysAssignments.set(emp.id, locked);

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

      // -----------------------------------------------------------------------
      // STEP 2: APPLY ROTATION GRID IN PRIORITY (if active pattern enabled)
      // -----------------------------------------------------------------------
      if (selectedPattern && selectedPattern.steps && selectedPattern.steps.length > 0) {
        const cycleLen = selectedPattern.cycleLength || selectedPattern.steps.length;

        activeEmployees.forEach(emp => {
          if (assignedToday.has(emp.id)) return;

          const stats = empStats.get(emp.id)!;

          // Check contract validity
          if (!isContractActive(emp, date)) {
            const offAsg: Assignment = {
              id: `gen-${date}-${emp.id}`,
              date,
              employeeId: emp.id,
              shiftCode: 'OFF',
              countedHours: 0,
              source: 'generated',
              author: 'Générateur Automatique',
              timestamp: new Date().toISOString(),
              comment: 'Contrat inactif sur cette date'
            };
            generatedAssignments.push(offAsg);
            todaysAssignments.set(emp.id, offAsg);
            assignedToday.add(emp.id);
            stats.consecutiveWorkDays = 0;
            stats.lastShiftCode = 'OFF';
            stats.lastDate = date;
            return;
          }

          // Calculate employee's step in the rotation cycle
          const offset = empOffsets.get(emp.id) || 0;
          const stepIndex = ((dayIndex + offset) % cycleLen + cycleLen) % cycleLen;
          const step = selectedPattern!.steps[stepIndex];

          // CASE 2.A: Rotation step prescribes REST (OFF)
          if (step.isRest || step.suggestedShiftCode === 'OFF' || step.requiredFamily === 'OFF') {
            const offAsg: Assignment = {
              id: `gen-${date}-${emp.id}`,
              date,
              employeeId: emp.id,
              shiftCode: 'OFF',
              countedHours: 0,
              source: 'generated',
              author: 'Générateur Automatique',
              timestamp: new Date().toISOString(),
              comment: `Rotation ${selectedPattern!.name} (Repos J${stepIndex + 1})`
            };
            generatedAssignments.push(offAsg);
            todaysAssignments.set(emp.id, offAsg);
            assignedToday.add(emp.id);
            rotationAppliedCount++;

            stats.consecutiveWorkDays = 0;
            stats.lastShiftCode = 'OFF';
            stats.lastDate = date;
            return;
          }

          // CASE 2.B: Rotation step prescribes WORK (M1, M2, S1, S3, etc.)
          let prescribedCode = step.suggestedShiftCode || step.requiredFamily || 'M1';
          let adjustedCode: string | null = null;
          let adjustmentComment: string | null = null;

          // HARD CONSTRAINT CHECK 1: Max consecutive working days (R23)
          if (stats.consecutiveWorkDays >= config.allowConsecutiveDaysLimit) {
            // Mandatory rest required by labor regulations!
            adjustedCode = 'OFF';
            adjustmentComment = `Ajustement réglementaire R23 : Repos obligatoire (${config.allowConsecutiveDaysLimit} jours consécutifs travaillés atteints)`;
          }

          // HARD CONSTRAINT CHECK 2: Mandatory 11h rest after late closing S3 (R27)
          if (!adjustedCode && (stats.lastShiftCode === 'S3' || stats.lastShiftCode === 'N')) {
            const shiftCandidate = shiftMap.get(prescribedCode);
            const isMorning = prescribedCode.startsWith('M') || (shiftCandidate && shiftCandidate.family === 'M');
            if (isMorning) {
              // Morning shift strictly violates 11h rest! Look for afternoon shift alternative (S1) or rest
              const s1Shift = findAuthorizedShiftInFamily(emp.id, 'S', 'S1');
              if (s1Shift) {
                adjustedCode = s1Shift.code;
                adjustmentComment = `Ajustement légal R27 : Shift ${s1Shift.code} substitué pour garantir les 11h de repos après S3`;
              } else {
                adjustedCode = 'OFF';
                adjustmentComment = 'Ajustement légal R27 : Repos garanti (11h requises après S3)';
              }
            }
          }

          // HARD CONSTRAINT CHECK 3: Qualification matrix authorization (R01)
          if (!adjustedCode) {
            if (!isQualified(emp.id, prescribedCode)) {
              // Attempt to adapt to another authorized shift in the same family
              const family = shiftMap.get(prescribedCode)?.family || (prescribedCode.startsWith('M') ? 'M' : 'S');
              const altShift = findAuthorizedShiftInFamily(emp.id, family);
              if (altShift) {
                adjustedCode = altShift.code;
                adjustmentComment = `Ajustement habilitation R01 : Shift ${altShift.code} attribué (non habilité sur ${prescribedCode})`;
              } else {
                adjustedCode = 'OFF';
                adjustmentComment = `Ajustement R01 : Non habilité pour la famille ${family}`;
              }
            }
          }

          const finalCode = adjustedCode || prescribedCode;
          const shiftObj = shiftMap.get(finalCode);
          const hours = shiftObj && shiftObj.type === 'travail' ? shiftObj.countedHours : 0;

          if (adjustedCode) {
            rotationAdjustmentsCount++;
          } else {
            rotationAppliedCount++;
          }

          const asg: Assignment = {
            id: `gen-${date}-${emp.id}`,
            date,
            employeeId: emp.id,
            shiftCode: finalCode,
            countedHours: hours,
            source: 'generated',
            author: 'Générateur Automatique',
            timestamp: new Date().toISOString(),
            comment: adjustmentComment || `Rotation ${selectedPattern!.name} (Poste J${stepIndex + 1})`
          };

          generatedAssignments.push(asg);
          todaysAssignments.set(emp.id, asg);
          assignedToday.add(emp.id);

          if (finalCode !== 'OFF' && shiftObj?.type === 'travail') {
            stats.consecutiveWorkDays++;
            stats.totalHours += hours;
            if (finalCode === 'S3') stats.s3Count++;
            if (isSunday) stats.sundaysCount++;
          } else {
            stats.consecutiveWorkDays = 0;
          }
          stats.lastShiftCode = finalCode;
          stats.lastDate = date;
        });

        // ---------------------------------------------------------------------
        // STEP 3: COVERAGE DEFICIT VERIFICATION & SURGICAL COMPLEMENT
        // Check if mandatory coverage minimums (S3, M1, S1, M2) are met by rotation.
        // If a deficit exists (e.g. due to absence or rest), adjust equitably.
        // ---------------------------------------------------------------------
        const priorityOrder = ['S3', 'M1', 'S1', 'M2'];
        const sortedReqs = [...dailyReqs].sort((a, b) => {
          const idxA = priorityOrder.indexOf(a.subFamily);
          const idxB = priorityOrder.indexOf(b.subFamily);
          return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
        });

        for (const req of sortedReqs) {
          const needed = req.minimum;
          let currentAssigned = 0;

          todaysAssignments.forEach(asg => {
            if (asg.shiftCode === req.subFamily) {
              currentAssigned++;
            }
          });

          while (currentAssigned < needed) {
            // Find best candidate to cover deficit:
            // Candidate must be active, contract active, qualified for req.subFamily,
            // not violating 11h rest, and not exceeding consecutive days limit.
            const candidates = activeEmployees.filter(emp => {
              if (!isContractActive(emp, date)) return false;
              if (!isQualified(emp.id, req.subFamily)) return false;

              const stats = empStats.get(emp.id)!;
              const currentAsg = todaysAssignments.get(emp.id);

              // Don't modify locked absences or already assigned to this requirement
              if (currentAsg && (currentAsg.source === 'manual' || currentAsg.isOverride || currentAsg.shiftCode === req.subFamily)) {
                return false;
              }

              // R27: If shift is M1 or M2, verify employee didn't work S3 yesterday
              if (req.subFamily.startsWith('M') && stats.lastShiftCode === 'S3') {
                return false;
              }

              // R23: If employee is currently on OFF, check consecutive days limit
              if (currentAsg?.shiftCode === 'OFF') {
                if (stats.consecutiveWorkDays >= config.allowConsecutiveDaysLimit) {
                  return false;
                }
              }

              return true;
            });

            if (candidates.length === 0) {
              // Mathematical impossibility to fulfill coverage on this date!
              if (!impossibleDates.includes(date)) impossibleDates.push(date);
              reasons.push({
                date,
                family: req.subFamily,
                missingCount: needed - currentAssigned,
                availableQualified: candidates.length,
                explanation: `Impossible de couvrir le besoin ${req.subFamily} le ${date}. Aucun agent habilité et disponible sans violation réglementaire.`
              });
              break;
            }

            // Score candidates for fairness & balance
            candidates.sort((a, b) => {
              const statsA = empStats.get(a.id)!;
              const statsB = empStats.get(b.id)!;
              const asgA = todaysAssignments.get(a.id);
              const asgB = todaysAssignments.get(b.id);

              let scoreA = 0;
              let scoreB = 0;

              // Prefer modifying an already-working employee in a non-critical shift
              // over calling in an employee scheduled for OFF
              if (asgA?.shiftCode === 'OFF') scoreA += 10;
              if (asgB?.shiftCode === 'OFF') scoreB += 10;

              if (req.subFamily === 'S3') {
                scoreA += statsA.s3Count * config.s3Weight;
                scoreB += statsB.s3Count * config.s3Weight;
              }
              if (isSunday) {
                scoreA += statsA.sundaysCount * config.sundayWeight;
                scoreB += statsB.sundaysCount * config.sundayWeight;
              }
              scoreA += (statsA.totalHours / 35) * config.hoursWeight;
              scoreB += (statsB.totalHours / 35) * config.hoursWeight;

              return scoreA - scoreB;
            });

            const chosen = candidates[0];
            const oldAsg = todaysAssignments.get(chosen.id);
            const shiftObj = shiftMap.get(req.subFamily);
            const hours = shiftObj ? shiftObj.countedHours : 7.5;
            const stats = empStats.get(chosen.id)!;

            if (oldAsg) {
              // Revert old assignment stats
              const oldShift = shiftMap.get(oldAsg.shiftCode);
              if (oldShift && oldShift.type === 'travail') {
                stats.totalHours -= oldAsg.countedHours;
                if (oldAsg.shiftCode === 'S3') stats.s3Count--;
                if (isSunday) stats.sundaysCount--;
              } else {
                stats.consecutiveWorkDays++;
              }

              // Update assignment
              oldAsg.shiftCode = req.subFamily;
              oldAsg.countedHours = hours;
              oldAsg.comment = `Ajustement couverture minimale ${req.subFamily} (R06-R09)`;

              // Apply new stats
              stats.totalHours += hours;
              if (req.subFamily === 'S3') stats.s3Count++;
              if (isSunday) stats.sundaysCount++;
              stats.lastShiftCode = req.subFamily;

              rotationAdjustmentsCount++;
              currentAssigned++;
            }
          }
        }
      } else {
        // =====================================================================
        // FALLBACK: PURE BALANCING GREEDY ALLOCATION (when rotation is disabled)
        // =====================================================================
        const priorityOrder = ['S3', 'M1', 'S1', 'M2'];
        const sortedReqs = [...dailyReqs].sort((a, b) => {
          const idxA = priorityOrder.indexOf(a.subFamily);
          const idxB = priorityOrder.indexOf(b.subFamily);
          return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
        });

        for (const req of sortedReqs) {
          const needed = req.minimum;
          let assignedCount = 0;

          for (const empId of assignedToday) {
            const asg = generatedAssignments.find(a => a.employeeId === empId && a.date === date);
            if (asg && asg.shiftCode === req.subFamily) {
              assignedCount++;
            }
          }

          while (assignedCount < needed) {
            const candidates = activeEmployees.filter(emp => {
              if (assignedToday.has(emp.id)) return false;
              if (!isContractActive(emp, date)) return false;
              if (!isQualified(emp.id, req.subFamily)) return false;

              const stats = empStats.get(emp.id);
              if (stats && stats.consecutiveWorkDays >= config.allowConsecutiveDaysLimit) {
                return false;
              }

              if (req.subFamily === 'M1' || req.subFamily === 'M2') {
                if (stats?.lastShiftCode === 'S3') return false;
              }

              return true;
            });

            if (candidates.length === 0) {
              if (!impossibleDates.includes(date)) impossibleDates.push(date);
              reasons.push({
                date,
                family: req.subFamily,
                missingCount: needed - assignedCount,
                availableQualified: candidates.length,
                explanation: `Impossible de couvrir le besoin ${req.subFamily} le ${date}. Aucun employé habilité et disponible.`
              });
              break;
            }

            candidates.sort((a, b) => {
              const statsA = empStats.get(a.id)!;
              const statsB = empStats.get(b.id)!;
              let scoreA = 0;
              let scoreB = 0;
              if (req.subFamily === 'S3') {
                scoreA += statsA.s3Count * config.s3Weight;
                scoreB += statsB.s3Count * config.s3Weight;
              }
              if (isSunday) {
                scoreA += statsA.sundaysCount * config.sundayWeight;
                scoreB += statsB.sundaysCount * config.sundayWeight;
              }
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

        // Remaining unassigned employees receive OFF
        activeEmployees.forEach(emp => {
          if (!assignedToday.has(emp.id)) {
            const stats = empStats.get(emp.id)!;
            generatedAssignments.push({
              id: `gen-${date}-${emp.id}`,
              date,
              employeeId: emp.id,
              shiftCode: 'OFF',
              countedHours: 0,
              source: 'generated',
              author: 'Générateur Automatique',
              timestamp: new Date().toISOString()
            });
            stats.lastShiftCode = 'OFF';
            stats.lastDate = date;
            stats.consecutiveWorkDays = 0;
            assignedToday.add(emp.id);
          }
        });
      }
    });

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

    const totalAssignments = generatedAssignments.length;
    const rotationAdherence = totalAssignments > 0
      ? Math.min(100, Math.round((rotationAppliedCount / totalAssignments) * 100))
      : 100;

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
        totalAssignments,
        workDaysCount: workDays,
        restDaysCount: restDays,
        s3Count: s3Total,
        sundayCount: sundayTotal,
        rotationAdherencePercentage: selectedPattern ? rotationAdherence : undefined,
        rotationAppliedCount: selectedPattern ? rotationAppliedCount : undefined,
        rotationAdjustmentsCount: selectedPattern ? rotationAdjustmentsCount : undefined,
        appliedRotationPatternName: selectedPattern ? selectedPattern.name : undefined
      }
    };
  }
}
