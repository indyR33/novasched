/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'PLANNER' | 'VIEWER';

export type ShiftType = 'travail' | 'absence' | 'repos' | 'statut';

export type ShiftFamily = 'M' | 'S' | 'J' | 'N' | 'T' | 'ABS' | 'REPOS' | 'AUTRE';

export interface Shift {
  code: string;
  label: string;
  startTime: string;      // e.g. "06:30"
  endTime: string;        // e.g. "14:30"
  isOvernight: boolean;   // true if crossing midnight (e.g. 22:30 -> 06:30)
  theoreticalDuration: number; // e.g. 8.0 hours
  countedHours: number;   // e.g. 7.5 hours (R15: distinction between theoretical and paid/counted)
  family: ShiftFamily;    // M1/M2 belong to M, S1/S3 belong to S, N, etc.
  subFamily?: string;     // e.g. "M1", "M2", "M3", "S1", "S2", "S3", "S4"
  type: ShiftType;
  isActive: boolean;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  notes?: string;
}

export interface Employee {
  id: string;
  matricule: string;
  lastName: string;
  firstName: string;
  arrivalDate: string;   // YYYY-MM-DD
  departureDate?: string; // YYYY-MM-DD (optional)
  isActive: boolean;
  team: string;          // Equipe A, B, etc.
  weeklyContractHours: number; // typically 35
  comparisonGroup: string; // e.g. "Opérateurs Polyvalents", "Techniciens"
  notes?: string;
}

export type QualificationStatus = 'AUTHORIZED' | 'CONDITIONAL' | 'NOT_AUTHORIZED';

export interface Qualification {
  employeeId: string;
  shiftCode: string;
  status: QualificationStatus;
  priority?: number;      // 1 to 5 (preference)
  conditionNote?: string;
}

export interface Assignment {
  id: string;
  date: string;          // YYYY-MM-DD
  employeeId: string;
  shiftCode: string;
  countedHours: number;
  source?: 'generated' | 'manual' | 'imported' | 'preserved';
  isOverride?: boolean;
  overrideReason?: string;
  overrideAuthor?: string;
  author?: string;
  timestamp?: string;
  comment?: string;
}

export interface CoverageRequirement {
  id: string;
  date: string;          // YYYY-MM-DD (or "DEFAULT_WEEKDAY" / "DEFAULT_WEEKEND")
  subFamily: string;     // e.g. "M1", "M2", "S1", "S3"
  minimum: number;
  maximum?: number;
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE';
}

export interface RotationPattern {
  id: string;
  name: string;
  description: string;
  cycleLength: number;   // e.g. 7 days or 14 days
  steps: Array<{
    dayIndex: number;    // 0 to cycleLength - 1
    requiredFamily?: ShiftFamily | 'OFF';
    suggestedShiftCode?: string;
    isRest: boolean;
  }>;
  isActive: boolean;
}

export interface PayPeriod {
  id: string;
  number: number;
  year: number;
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  label: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
}

export type RuleLevel = 'HARD' | 'WARNING' | 'OPTIMISATION' | 'INFO' | 'A_VALIDER';

export interface RuleDefinition {
  id: string;            // e.g. "R01"
  code: string;
  name: string;
  description: string;
  category: 'HABILITATION' | 'CONTRAT' | 'COUVERTURE' | 'EQUILIBRAGE' | 'ROTATION' | 'SYSTEME';
  defaultLevel: RuleLevel;
  currentLevel: RuleLevel;
  isEnabled: boolean;
  parameters: Record<string, number | string | boolean>;
  explanationTemplate: string;
}

export interface ValidationIssue {
  id: string;
  ruleId: string;
  level: RuleLevel;
  date?: string;
  employeeId?: string;
  shiftCode?: string;
  title: string;
  message: string;
  details?: string;
  canOverride?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  actor?: string;
  userRole?: UserRole;
  action: string;
  targetType?: string;
  targetId?: string;
  summary?: string;
  details?: string | Record<string, unknown>;
  reason?: string;
}

export type AuditLog = AuditLogEntry;

export type PlanningStatus = 'DRAFT' | 'V1' | 'V2' | 'V3' | 'PUBLISHED' | 'ARCHIVED';

export interface PlanningVersion {
  id: string;
  name: string;
  periodId: string;
  startDate: string;
  endDate: string;
  versionNumber: number;
  status: PlanningStatus;
  author: string;
  createdAt: string;
  updatedAt: string;
  comment: string;
  source?: 'MANUAL' | 'GENERATED' | 'IMPORTED';
  assignments: Assignment[];
  validationScore: number; // 0 to 100
  hardViolationsCount?: number;
  warningsCount?: number;
}

export interface VersionDiffItem {
  date: string;
  employeeId: string;
  employeeName: string;
  oldShiftCode?: string;
  newShiftCode?: string;
  oldHours: number;
  newHours: number;
  isS3Changed: boolean;
  isSundayChanged: boolean;
}

export interface GenerationConfig {
  startDate: string;
  endDate: string;
  respectRotations: boolean;
  selectedRotationPatternId?: string;
  rotationStaggerMode?: 'EMPLOYEE_STAGGERED' | 'TEAM_STAGGERED' | 'UNIFORM';
  balanceS3: boolean;
  balanceSundays: boolean;
  balanceHours: boolean;
  allowConsecutiveDaysLimit: number;
  targetWeeklyWorkDays: number;
  targetWeeklyRestDays: number;
  s3Weight: number;
  sundayWeight: number;
  hoursWeight: number;
  preserveExistingAssignments?: boolean;
  linkToPriorHistory?: boolean;
}

export interface GenerationDiagnostic {
  isPossible: boolean;
  impossibleDates: string[];
  reasons: Array<{
    date: string;
    family: string;
    missingCount: number;
    availableQualified: number;
    explanation: string;
  }>;
  suggestedActions: string[];
}
