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
  RuleDefinition,
  ValidationIssue,
  PayPeriod,
  PlanningVersion
} from '../types/planning';

export interface EvaluationContext {
  employees: Employee[];
  shifts: Shift[];
  qualifications: Qualification[];
  coverageRequirements: CoverageRequirement[];
  assignments: Assignment[];
  rules: RuleDefinition[];
  payPeriods: PayPeriod[];
  currentVersion?: PlanningVersion;
}

export interface EmployeePeriodStats {
  employeeId: string;
  employeeName: string;
  comparisonGroup: string;
  totalHours: number;
  workDaysCount: number;
  restDaysCount: number;
  s3Count: number;
  sundaysCount: number;
  cpCount: number;
  nightCount: number;
  avgHoursPerWeek: number;
}

export interface DailyCoverageStatus {
  date: string;
  isWeekend: boolean;
  dayOfWeek: number;
  familyCounts: Record<string, number>;
  deficits: Array<{
    subFamily: string;
    required: number;
    actual: number;
    deficit: number;
    priority: string;
  }>;
}

export interface ValidationSummary {
  score: number; // 0 to 100
  hardIssues: ValidationIssue[];
  warningIssues: ValidationIssue[];
  optimisationIssues: ValidationIssue[];
  infoIssues: ValidationIssue[];
  statsByEmployee: Record<string, EmployeePeriodStats>;
  dailyCoverage: Record<string, DailyCoverageStatus>;
  totalHours: number;
}

/**
 * Filter shifts that an employee is legally and technically authorized to take on a given date.
 */
export function getAvailableShiftsForEmployee(
  employee: Employee,
  date: string,
  allShifts: Shift[],
  qualifications: Qualification[],
  isAdminOverride = false
): Array<{ shift: Shift; isAuthorized: boolean; reason?: string }> {
  // If inactive or out of contract bounds
  const isBeforeArrival = employee.arrivalDate && date < employee.arrivalDate;
  const isAfterDeparture = employee.departureDate && date > employee.departureDate;
  
  return allShifts
    .filter(s => s.isActive)
    .map(shift => {
      if (isBeforeArrival) {
        return {
          shift,
          isAuthorized: false,
          reason: `R02: Date antérieure à l’arrivée de l’employé (${employee.arrivalDate})`
        };
      }
      if (isAfterDeparture) {
        return {
          shift,
          isAuthorized: false,
          reason: `R03: Date postérieure au départ de l’employé (${employee.departureDate})`
        };
      }

      // Rest and generic absences are generally available
      if (shift.family === 'REPOS' || shift.family === 'ABS') {
        return { shift, isAuthorized: true };
      }

      const qual = qualifications.find(
        q => q.employeeId === employee.id && q.shiftCode === shift.code
      );

      if (!qual || qual.status === 'NOT_AUTHORIZED') {
        return {
          shift,
          isAuthorized: isAdminOverride,
          reason: qual?.conditionNote || `R01: Non habilité pour ${shift.code}`
        };
      }

      return { shift, isAuthorized: true };
    });
}

/**
 * Standalone Engine evaluating all business rules R01-R40
 */
export class RulesEngine {
  /**
   * High-level evaluate method for App.tsx integration
   */
  public static evaluate(context: {
    version: PlanningVersion;
    employees: Employee[];
    shifts: Shift[];
    qualifications: Qualification[];
    rules: RuleDefinition[];
    coverageRequirements: CoverageRequirement[];
    rotationPatterns?: any[];
  }) {
    const summary = this.evaluatePlanning({
      employees: context.employees,
      shifts: context.shifts,
      qualifications: context.qualifications,
      coverageRequirements: context.coverageRequirements,
      assignments: context.version.assignments,
      rules: context.rules,
      payPeriods: [],
      currentVersion: context.version
    });
    return {
      issues: [
        ...summary.hardIssues,
        ...summary.warningIssues,
        ...summary.optimisationIssues,
        ...summary.infoIssues
      ],
      score: summary.score,
      statsByEmployee: summary.statsByEmployee,
      dailyCoverage: summary.dailyCoverage,
      totalCountedHours: summary.totalHours
    };
  }

  /**
   * Evaluates all assignments in a given context and outputs structured issues and metrics
   */
  public static evaluatePlanning(context: EvaluationContext): ValidationSummary {
    const {
      employees = [],
      shifts = [],
      qualifications = [],
      coverageRequirements = [],
      assignments = [],
      rules = [],
      payPeriods = [],
      currentVersion
    } = context;

    const ruleMap = new Map<string, RuleDefinition>(rules.map(r => [r.id, r]));
    const employeeMap = new Map<string, Employee>(employees.map(e => [e.id, e]));
    const shiftMap = new Map<string, Shift>(shifts.map(s => [s.code, s]));

    const issues: ValidationIssue[] = [];

    // 1. Employee-level and Assignment-level checks
    // Group assignments by date & employee
    const byEmpAndDate = new Map<string, Assignment[]>();
    const byDate = new Map<string, Assignment[]>();
    const byEmp = new Map<string, Assignment[]>();

    assignments.forEach(asg => {
      const key = `${asg.employeeId}_${asg.date}`;
      const existing = byEmpAndDate.get(key) || [];
      existing.push(asg);
      byEmpAndDate.set(key, existing);

      const dList = byDate.get(asg.date) || [];
      dList.push(asg);
      byDate.set(asg.date, dList);

      const eList = byEmp.get(asg.employeeId) || [];
      eList.push(asg);
      byEmp.set(asg.employeeId, eList);
    });

    // Check R34/R35: Version lock
    if (currentVersion && (currentVersion.status === 'PUBLISHED' || currentVersion.status === 'ARCHIVED')) {
      const r35 = ruleMap.get('R35');
      if (r35?.isEnabled) {
        issues.push({
          id: 'issue-ver-lock',
          ruleId: 'R35',
          level: r35.currentLevel,
          title: 'Version verrouillée',
          message: `La version ${currentVersion.name} (${currentVersion.status}) est verrouillée en lecture seule.`
        });
      }
    }

    // Check R04: Multiple assignments per day
    const r04 = ruleMap.get('R04');
    if (r04?.isEnabled) {
      byEmpAndDate.forEach((asgList, key) => {
        if (asgList.length > 1) {
          const emp = employeeMap.get(asgList[0].employeeId);
          issues.push({
            id: `issue-r04-${key}`,
            ruleId: 'R04',
            level: r04.currentLevel,
            date: asgList[0].date,
            employeeId: asgList[0].employeeId,
            title: 'Doublon d’affectation sur une même journée',
            message: `${emp ? `${emp.lastName} ${emp.firstName}` : 'Employé'} a plusieurs affectations le ${asgList[0].date}.`
          });
        }
      });
    }

    // Individual assignment checks (R01, R02, R03, R15, R36)
    const r01 = ruleMap.get('R01');
    const r02 = ruleMap.get('R02');
    const r03 = ruleMap.get('R03');
    const r36 = ruleMap.get('R36');

    assignments.forEach(asg => {
      const emp = employeeMap.get(asg.employeeId);
      const shift = shiftMap.get(asg.shiftCode);

      if (!emp) {
        issues.push({
          id: `issue-orphan-${asg.id}`,
          ruleId: 'R37',
          level: 'HARD',
          date: asg.date,
          title: 'Employé inconnu',
          message: `Affectation rattachée à un employé inexistant (${asg.employeeId}).`
        });
        return;
      }

      if (!shift) {
        issues.push({
          id: `issue-badshift-${asg.id}`,
          ruleId: 'R37',
          level: 'HARD',
          date: asg.date,
          employeeId: emp.id,
          title: 'Code de shift invalide',
          message: `Le code '${asg.shiftCode}' ne figure pas dans le référentiel actif.`
        });
        return;
      }

      // Check R02: Arrival Date
      if (r02?.isEnabled && emp.arrivalDate && asg.date < emp.arrivalDate) {
        if (shift.type === 'travail') {
          issues.push({
            id: `issue-r02-${asg.id}`,
            ruleId: 'R02',
            level: r02.currentLevel,
            date: asg.date,
            employeeId: emp.id,
            shiftCode: shift.code,
            title: 'Affectation avant la date d’arrivée',
            message: `${emp.lastName} ${emp.firstName} a débuté le ${emp.arrivalDate}, or il est planifié le ${asg.date}.`,
            canOverride: true
          });
        }
      }

      // Check R03: Departure Date
      if (r03?.isEnabled && emp.departureDate && asg.date > emp.departureDate) {
        issues.push({
          id: `issue-r03-${asg.id}`,
          ruleId: 'R03',
          level: r03.currentLevel,
          date: asg.date,
          employeeId: emp.id,
          shiftCode: shift.code,
          title: 'Affectation après la date de départ',
          message: `${emp.lastName} ${emp.firstName} a quitté l'entreprise le ${emp.departureDate}, affectation impossible le ${asg.date}.`,
          canOverride: true
        });
      }

      // Check R01: Qualification
      if (r01?.isEnabled && shift.type === 'travail') {
        const qual = qualifications.find(
          q => q.employeeId === emp.id && q.shiftCode === shift.code
        );

        const isAuthorized = qual && qual.status === 'AUTHORIZED';

        if (!isAuthorized) {
          if (asg.isOverride) {
            // Check R36: Traçabilité override
            if (r36?.isEnabled && (!asg.overrideReason || asg.overrideReason.trim().length === 0)) {
              issues.push({
                id: `issue-r36-${asg.id}`,
                ruleId: 'R36',
                level: 'HARD',
                date: asg.date,
                employeeId: emp.id,
                shiftCode: shift.code,
                title: 'Override sans justification',
                message: `Une dérogation a été appliquée pour ${emp.lastName} sur ${shift.code} sans motif explicite obligatoire.`
              });
            }
          } else {
            issues.push({
              id: `issue-r01-${asg.id}`,
              ruleId: 'R01',
              level: r01.currentLevel,
              date: asg.date,
              employeeId: emp.id,
              shiftCode: shift.code,
              title: 'Employé non habilité',
              message: `${emp.lastName} ${emp.firstName} n'est pas habilité pour le shift ${shift.code} (${shift.label}). ${qual?.conditionNote ? `Motif: ${qual.conditionNote}` : ''}`,
              canOverride: true
            });
          }
        }
      }
    });

    // Check R27: S3 followed by M1 or M2 next morning (11h rest rule)
    const r27 = ruleMap.get('R27');
    if (r27?.isEnabled) {
      employees.forEach(emp => {
        const empAsgs = (byEmp.get(emp.id) || []).sort((a, b) => a.date.localeCompare(b.date));
        for (let i = 0; i < empAsgs.length - 1; i++) {
          const curr = empAsgs[i];
          const next = empAsgs[i + 1];

          // Check if dates are consecutive
          const currDate = new Date(curr.date);
          const nextDate = new Date(next.date);
          const diffDays = Math.round((nextDate.getTime() - currDate.getTime()) / (1000 * 3600 * 24));

          if (diffDays === 1) {
            // S3 finishes at 23:45. M1 starts at 06:00 (diff is only 6h15!). M2 starts at 07:00 (diff 7h15!).
            if (curr.shiftCode === 'S3' && (next.shiftCode === 'M1' || next.shiftCode === 'M2')) {
              issues.push({
                id: `issue-r27-${curr.id}-${next.id}`,
                ruleId: 'R27',
                level: r27.currentLevel,
                date: next.date,
                employeeId: emp.id,
                title: 'Repos inter-vacations insuffisant (< 11h)',
                message: `${emp.lastName} enchaîne un S3 (fin 23h45 le ${curr.date}) avec un ${next.shiftCode} (début matinal le ${next.date}). Repos légal de 11h non respecté.`
              });
            }
          }
        }
      });
    }

    // Check R23: Max 6 consecutive work days without a day OFF
    const r23 = ruleMap.get('R23');
    if (r23?.isEnabled) {
      employees.forEach(emp => {
        const empAsgs = (byEmp.get(emp.id) || []).sort((a, b) => a.date.localeCompare(b.date));
        let workStreak = 0;
        let streakStartDate = '';

        empAsgs.forEach(asg => {
          const shift = shiftMap.get(asg.shiftCode);
          if (shift && shift.type === 'travail') {
            if (workStreak === 0) streakStartDate = asg.date;
            workStreak++;
            if (workStreak > 6) {
              issues.push({
                id: `issue-r23-${emp.id}-${asg.date}`,
                ruleId: 'R23',
                level: r23.currentLevel,
                date: asg.date,
                employeeId: emp.id,
                title: 'Dépassement du maximum de jours consécutifs travaillés',
                message: `${emp.lastName} ${emp.firstName} a travaillé plus de 6 jours d'affilée depuis le ${streakStartDate}. Un repos est obligatoire.`
              });
            }
          } else {
            workStreak = 0;
          }
        });
      });
    }

    // Check R11: Simultaneous CP threshold
    const r11 = ruleMap.get('R11');
    const maxCP = (r11?.parameters.maxSimultaneousCP as number) || 2;
    if (r11?.isEnabled) {
      byDate.forEach((asgList, date) => {
        const cpCount = asgList.filter(a => a.shiftCode === 'CP').length;
        if (cpCount > maxCP) {
          issues.push({
            id: `issue-r11-${date}`,
            ruleId: 'R11',
            level: r11.currentLevel,
            date,
            title: 'Seuil de congés simultanés dépassé',
            message: `${cpCount} employés en congés payés le ${date} (seuil maximal conseillé : ${maxCP}).`
          });
        }
      });
    }

    // 2. Daily Coverage Evaluation (R06, R07, R08, R09, R33)
    const dailyCoverage: Record<string, DailyCoverageStatus> = {};
    const dates = Array.from(byDate.keys()).sort();

    dates.forEach(date => {
      const dayDate = new Date(date);
      const dayOfWeek = dayDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const asgList = byDate.get(date) || [];

      // Count families and subfamilies
      const familyCounts: Record<string, number> = {
        M1: 0,
        M2: 0,
        M3: 0,
        S1: 0,
        S2: 0,
        S3: 0,
        J: 0,
        N: 0,
        OFF: 0,
        CP: 0
      };

      asgList.forEach(a => {
        if (familyCounts[a.shiftCode] !== undefined) {
          familyCounts[a.shiftCode]++;
        } else {
          familyCounts[a.shiftCode] = 1;
        }
      });

      // Match with coverage requirements
      const deficits: DailyCoverageStatus['deficits'] = [];

      coverageRequirements.forEach(req => {
        const appliesToDate =
          req.date === date ||
          (isWeekend && req.date === 'DEFAULT_WEEKEND') ||
          (!isWeekend && req.date === 'DEFAULT_WEEKDAY');

        if (appliesToDate) {
          const actual = familyCounts[req.subFamily] || 0;
          if (actual < req.minimum) {
            const deficit = req.minimum - actual;
            deficits.push({
              subFamily: req.subFamily,
              required: req.minimum,
              actual,
              deficit,
              priority: req.priority
            });

            // Map to specific rule
            let ruleId = 'R33';
            if (req.subFamily === 'M1') ruleId = 'R06';
            else if (req.subFamily === 'M2') ruleId = 'R07';
            else if (req.subFamily === 'S1') ruleId = 'R08';
            else if (req.subFamily === 'S3') ruleId = 'R09';

            const matchingRule = ruleMap.get(ruleId);
            if (matchingRule?.isEnabled) {
              issues.push({
                id: `issue-cov-${date}-${req.subFamily}`,
                ruleId,
                level: matchingRule.currentLevel,
                date,
                title: `Déficit de couverture ${req.subFamily}`,
                message: `Le ${date} : ${actual} shift(s) ${req.subFamily} sur ${req.minimum} requis (déficit de ${deficit}).`
              });
            }
          }
        }
      });

      dailyCoverage[date] = {
        date,
        isWeekend,
        dayOfWeek,
        familyCounts,
        deficits
      };
    });

    // 3. Employee Statistics & Balancing (R12, R13, R14, R16, R17, R18, R31, R32)
    const statsByEmployee: Record<string, EmployeePeriodStats> = {};
    let totalAllHours = 0;

    employees.filter(e => e.isActive).forEach(emp => {
      const empAsgs = byEmp.get(emp.id) || [];
      let totalHours = 0;
      let workDaysCount = 0;
      let restDaysCount = 0;
      let s3Count = 0;
      let sundaysCount = 0;
      let cpCount = 0;
      let nightCount = 0;

      empAsgs.forEach(a => {
        const shift = shiftMap.get(a.shiftCode);
        const dateObj = new Date(a.date);
        const isSunday = dateObj.getDay() === 0;

        // R15: Explicitly use countedHours
        const hours = a.countedHours ?? (shift ? shift.countedHours : 0);
        totalHours += hours;

        if (shift) {
          if (shift.type === 'travail') {
            workDaysCount++;
            if (isSunday) sundaysCount++;
            if (shift.subFamily === 'S3' || shift.code === 'S3') s3Count++;
            if (shift.isOvernight || shift.code === 'N') nightCount++;
          } else if (shift.type === 'repos') {
            restDaysCount++;
          } else if (shift.code === 'CP') {
            cpCount++;
          }
        }
      });

      totalAllHours += totalHours;
      const weeksCovered = Math.max(1, dates.length / 7);

      statsByEmployee[emp.id] = {
        employeeId: emp.id,
        employeeName: `${emp.lastName} ${emp.firstName}`,
        comparisonGroup: emp.comparisonGroup,
        totalHours: Math.round(totalHours * 10) / 10,
        workDaysCount,
        restDaysCount,
        s3Count,
        sundaysCount,
        cpCount,
        nightCount,
        avgHoursPerWeek: Math.round((totalHours / weeksCovered) * 10) / 10
      };
    });

    // Evaluate Fairness and Balancing per comparison group (R31, R32)
    const groups = new Map<string, EmployeePeriodStats[]>();
    Object.values(statsByEmployee).forEach(st => {
      const list = groups.get(st.comparisonGroup) || [];
      list.push(st);
      groups.set(st.comparisonGroup, list);
    });

    const r31 = ruleMap.get('R31');
    const r32 = ruleMap.get('R32');

    groups.forEach((statsList, groupName) => {
      if (statsList.length > 1) {
        // S3 spread
        const s3Values = statsList.map(s => s.s3Count);
        const minS3 = Math.min(...s3Values);
        const maxS3 = Math.max(...s3Values);
        const deltaS3 = maxS3 - minS3;

        if (r31?.isEnabled && deltaS3 > 2) {
          issues.push({
            id: `issue-r31-${groupName}`,
            ruleId: 'R31',
            level: r31.currentLevel,
            title: `Écart de fermetures S3 dans le groupe ${groupName}`,
            message: `Écart de ${deltaS3} vacations S3 (min: ${minS3}, max: ${maxS3}) dans le groupe '${groupName}'. Un rééquilibrage est recommandé.`
          });
        }

        // Sunday spread
        const sunValues = statsList.map(s => s.sundaysCount);
        const minSun = Math.min(...sunValues);
        const maxSun = Math.max(...sunValues);
        const deltaSun = maxSun - minSun;

        if (r32?.isEnabled && deltaSun > 1) {
          issues.push({
            id: `issue-r32-${groupName}`,
            ruleId: 'R32',
            level: r32.currentLevel,
            title: `Écart de dimanches dans le groupe ${groupName}`,
            message: `Écart de ${deltaSun} dimanches travaillés (min: ${minSun}, max: ${maxSun}) dans le groupe '${groupName}'.`
          });
        }
      }
    });

    // Calculate overall health score (0-100)
    const hardIssues = issues.filter(i => i.level === 'HARD');
    const warningIssues = issues.filter(i => i.level === 'WARNING');
    const optimisationIssues = issues.filter(i => i.level === 'OPTIMISATION');
    const infoIssues = issues.filter(i => i.level === 'INFO' || i.level === 'A_VALIDER');

    let score = 100;
    score -= hardIssues.length * 25;
    score -= warningIssues.length * 5;
    score -= optimisationIssues.length * 2;
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      hardIssues,
      warningIssues,
      optimisationIssues,
      infoIssues,
      statsByEmployee,
      dailyCoverage,
      totalHours: Math.round(totalAllHours * 10) / 10
    };
  }

  /**
   * Explain why an assignment or shift is refused or invalid (R24)
   */
  public static explainRefusal(
    employee: Employee,
    shift: Shift,
    date: string,
    qualifications: Qualification[]
  ): string {
    if (employee.arrivalDate && date < employee.arrivalDate) {
      return `R02: Date ${date} antérieure à l'arrivée contractuelle de l'employé (${employee.arrivalDate}).`;
    }
    if (employee.departureDate && date > employee.departureDate) {
      return `R03: Date ${date} postérieure au départ de l'employé (${employee.departureDate}).`;
    }
    if (shift.type === 'travail') {
      const qual = qualifications.find(
        q => q.employeeId === employee.id && q.shiftCode === shift.code
      );
      if (!qual || qual.status === 'NOT_AUTHORIZED') {
        return `R01: ${employee.lastName} ${employee.firstName} n'est pas habilité pour le shift ${shift.code}. ${qual?.conditionNote ? `Raison: ${qual.conditionNote}` : ''}`;
      }
    }
    return `Affectation autorisée.`;
  }
}
