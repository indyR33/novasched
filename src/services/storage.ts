/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Employee,
  Shift,
  Qualification,
  CoverageRequirement,
  RotationPattern,
  PayPeriod,
  RuleDefinition,
  PlanningVersion,
  AuditLogEntry,
  Assignment,
  UserRole
} from '../types/planning';
import {
  INITIAL_EMPLOYEES,
  INITIAL_SHIFTS,
  INITIAL_QUALIFICATIONS,
  INITIAL_COVERAGE,
  INITIAL_ROTATION_PATTERNS,
  INITIAL_PAY_PERIODS,
  INITIAL_RULES,
  INITIAL_PLANNING_VERSION
} from '../data/initialData';

const STORAGE_KEYS = {
  EMPLOYEES: 'smart_planning_employees_v1',
  SHIFTS: 'smart_planning_shifts_v1',
  QUALIFICATIONS: 'smart_planning_qualifications_v1',
  COVERAGE: 'smart_planning_coverage_v1',
  ROTATIONS: 'smart_planning_rotations_v1',
  PAY_PERIODS: 'smart_planning_pay_periods_v1',
  RULES: 'smart_planning_rules_v1',
  VERSIONS: 'smart_planning_versions_v1',
  CURRENT_VERSION_ID: 'smart_planning_current_version_id_v1',
  AUDIT_LOGS: 'smart_planning_audit_logs_v1',
  USER_ROLE: 'smart_planning_user_role_v1'
};

export class StorageService {
  public static loadEmployees(): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) {
      this.saveEmployees(INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EMPLOYEES;
    }
  }

  public static saveEmployees(employees: Employee[]): void {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }

  public static loadShifts(): Shift[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (!raw) {
      this.saveShifts(INITIAL_SHIFTS);
      return INITIAL_SHIFTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SHIFTS;
    }
  }

  public static saveShifts(shifts: Shift[]): void {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }

  public static loadQualifications(): Qualification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUALIFICATIONS);
    if (!raw) {
      this.saveQualifications(INITIAL_QUALIFICATIONS);
      return INITIAL_QUALIFICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_QUALIFICATIONS;
    }
  }

  public static saveQualifications(qualifications: Qualification[]): void {
    localStorage.setItem(STORAGE_KEYS.QUALIFICATIONS, JSON.stringify(qualifications));
  }

  public static loadCoverage(): CoverageRequirement[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COVERAGE);
    if (!raw) {
      this.saveCoverage(INITIAL_COVERAGE);
      return INITIAL_COVERAGE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_COVERAGE;
    }
  }

  public static saveCoverage(coverage: CoverageRequirement[]): void {
    localStorage.setItem(STORAGE_KEYS.COVERAGE, JSON.stringify(coverage));
  }

  public static loadRotations(): RotationPattern[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ROTATIONS);
    if (!raw) {
      this.saveRotations(INITIAL_ROTATION_PATTERNS);
      return INITIAL_ROTATION_PATTERNS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_ROTATION_PATTERNS;
    }
  }

  public static saveRotations(rotations: RotationPattern[]): void {
    localStorage.setItem(STORAGE_KEYS.ROTATIONS, JSON.stringify(rotations));
  }

  public static loadPayPeriods(): PayPeriod[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAY_PERIODS);
    if (!raw) {
      this.savePayPeriods(INITIAL_PAY_PERIODS);
      return INITIAL_PAY_PERIODS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PAY_PERIODS;
    }
  }

  public static savePayPeriods(periods: PayPeriod[]): void {
    localStorage.setItem(STORAGE_KEYS.PAY_PERIODS, JSON.stringify(periods));
  }

  public static loadRules(): RuleDefinition[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RULES);
    if (!raw) {
      this.saveRules(INITIAL_RULES);
      return INITIAL_RULES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RULES;
    }
  }

  public static saveRules(rules: RuleDefinition[]): void {
    localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
  }

  public static loadVersions(): PlanningVersion[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VERSIONS);
    if (!raw) {
      this.saveVersions([INITIAL_PLANNING_VERSION]);
      return [INITIAL_PLANNING_VERSION];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [INITIAL_PLANNING_VERSION];
    }
  }

  public static saveVersions(versions: PlanningVersion[]): void {
    localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions));
  }

  public static loadAuditLogs(): AuditLogEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      const initialLog: AuditLogEntry = {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        userId: 'Admin Ops',
        userRole: 'ADMIN',
        action: 'CREATE',
        targetType: 'PLANNING_VERSION',
        targetId: INITIAL_PLANNING_VERSION.id,
        summary: 'Initialisation du système smart Planning avec référentiels complets et version de référence.'
      };
      this.saveAuditLogs([initialLog]);
      return [initialLog];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveAuditLogs(logs: AuditLogEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(-500))); // Keep last 500
  }

  public static logAction(
    action: AuditLogEntry['action'],
    targetType: AuditLogEntry['targetType'],
    targetId: string,
    summary: string,
    userRole: UserRole = 'ADMIN',
    userId = 'Chef d’équipe Opérations',
    details?: Record<string, unknown>
  ): void {
    const logs = this.loadAuditLogs();
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId,
      userRole,
      action,
      targetType,
      targetId,
      summary,
      details
    };
    logs.unshift(entry);
    this.saveAuditLogs(logs);
  }

  public static loadUserRole(): UserRole {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (raw === 'ADMIN' || raw === 'PLANNER' || raw === 'VIEWER') {
      return raw;
    }
    return 'ADMIN';
  }

  public static saveUserRole(role: UserRole): void {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  }

  // Convenient aliases matching App.tsx interface
  public static getEmployees(): Employee[] { return this.loadEmployees(); }
  public static getShifts(): Shift[] { return this.loadShifts(); }
  public static getQualifications(): Qualification[] { return this.loadQualifications(); }
  public static getCoverageRequirements(): CoverageRequirement[] { return this.loadCoverage(); }
  public static saveCoverageRequirements(reqs: CoverageRequirement[]): void { this.saveCoverage(reqs); }
  public static getRotationPatterns(): RotationPattern[] { return this.loadRotations(); }
  public static saveRotationPatterns(patterns: RotationPattern[]): void { this.saveRotations(patterns); }
  public static getPayPeriods(): PayPeriod[] { return this.loadPayPeriods(); }
  public static getRules(): RuleDefinition[] { return this.loadRules(); }
  public static getVersions(): PlanningVersion[] { return this.loadVersions(); }
  public static getAuditLogs(): AuditLogEntry[] { return this.loadAuditLogs(); }

  public static getActiveVersionId(): string {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION_ID) || this.loadVersions()[0]?.id || 'ver-01';
  }

  public static setActiveVersionId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_VERSION_ID, id);
  }

  public static addAuditLog(action: string, actor: string, details: string, reason?: string): void {
    const logs = this.loadAuditLogs();
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: actor,
      actor,
      action,
      details,
      summary: details,
      reason
    };
    logs.unshift(entry);
    this.saveAuditLogs(logs);
  }

  public static resetToFactoryDefaults(): void {
    localStorage.clear();
    this.saveEmployees(INITIAL_EMPLOYEES);
    this.saveShifts(INITIAL_SHIFTS);
    this.saveQualifications(INITIAL_QUALIFICATIONS);
    this.saveCoverage(INITIAL_COVERAGE);
    this.saveRotations(INITIAL_ROTATION_PATTERNS);
    this.savePayPeriods(INITIAL_PAY_PERIODS);
    this.saveRules(INITIAL_RULES);
    this.saveVersions([INITIAL_PLANNING_VERSION]);
  }
}
