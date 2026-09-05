/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RuleI18n {
  name: string;
  description: string;
}

export const RULES_EN: Record<string, RuleI18n> = {
  R01: {
    name: 'Shift Qualification',
    description: 'An employee can only be assigned to a shift code authorized in their qualification matrix.'
  },
  R02: {
    name: 'Contract Start Date',
    description: 'No work assignment or attendance before the contractual start date.'
  },
  R03: {
    name: 'Contract End Date',
    description: 'No assignment after the declared departure date.'
  },
  R04: {
    name: 'Single Assignment Per Day',
    description: 'An employee can have only one primary shift assignment per day.'
  },
  R05: {
    name: 'Contextual Shift Options',
    description: 'Offered shift codes strictly depend on qualifications and active employee profile.'
  },
  R06: {
    name: 'Minimum M1 Coverage',
    description: 'Reach the configured minimum number of M1 shifts to ensure opening.'
  },
  R07: {
    name: 'Minimum M2 Coverage',
    description: 'Reach the minimum required M2 shifts for standard morning operations.'
  },
  R08: {
    name: 'Minimum S1 Coverage',
    description: 'Reach the minimum required S1 shifts for afternoon handover.'
  },
  R09: {
    name: 'Minimum S3 Coverage',
    description: 'Reach the minimum required S3 shifts to secure late closing.'
  },
  R10: {
    name: 'Undesirable Heavy Sequence',
    description: 'Detects consecutive heavy shifts without adequate rest.'
  },
  R11: {
    name: 'Simultaneous Leave Threshold',
    description: 'Alert if the number of agents on paid leave on the same day exceeds quota.'
  },
  R12: {
    name: 'Individual S3 Shift Count',
    description: 'Track the number of S3 shifts per employee to prevent scheduling asymmetry.'
  },
  R13: {
    name: 'Sunday Shifts Count',
    description: 'Track worked Sundays per employee for workload balancing.'
  },
  R14: {
    name: 'Counted Hours Totalization',
    description: 'Sum actual counted hours defined in the shift master directory.'
  },
  R15: {
    name: 'Theoretical vs Paid Hours Split',
    description: 'Never deduce paid hours solely from start-end span without using countedHours.'
  },
  R16: {
    name: 'Non-Calendar Pay Period',
    description: 'Calculate hours according to configured payroll cutoff dates, not calendar month.'
  },
  R17: {
    name: 'Target Weekly Work Days',
    description: 'Aim for a target average of approximately 4.5 to 5 worked days per week.'
  },
  R18: {
    name: 'Target Weekly Rest Days',
    description: 'Aim for a target average of approximately 2 to 2.5 rest days per week.'
  },
  R19: {
    name: 'Target Attendance Rate',
    description: 'Optimize the attendance rate without blocking by default.'
  },
  R20: {
    name: 'Shift Density & Spacing',
    description: 'Avoid excessive breaks or isolated single shifts.'
  },
  R21: {
    name: 'Average Shift Duration',
    description: 'Target average shift duration matching site standards (e.g. 7.5h).'
  },
  R22: {
    name: 'Rotation Pattern Adherence',
    description: 'Follow the configured rotation cycle pattern for assigned agents.'
  },
  R23: {
    name: 'Work / Rest Sequences',
    description: 'Guarantee at least 1 rest day after a maximum of 6 consecutive work days.'
  },
  R24: {
    name: 'Shift Families vs Detailed Codes',
    description: 'Distinguish functional family (M, S, J, N) from specific shift code.'
  },
  R25: {
    name: 'Absence & Non-Work Statuses',
    description: 'Leave, Sick, Rest, and Family leave follow specific hour and availability rules.'
  },
  R26: {
    name: 'Overnight Shifts Allocation',
    description: 'Night shifts (e.g. 22:00-06:00) remain attached accounting-wise to their start date.'
  },
  R27: {
    name: 'Late S3 Rest Continuity',
    description: 'Ensure adequate rest (at least 11h) between an S3 shift (ends 23:45) and a morning M shift.'
  },
  R28: {
    name: 'Shift Notes & Audit History',
    description: 'Allow attaching an explanatory note to any assignment or day.'
  },
  R29: {
    name: 'Version Differences Comparator',
    description: 'Display changes in cells, hour volumes, and counters across versions.'
  },
  R30: {
    name: 'Real-Time Totals Recalculation',
    description: 'Recalculate hours, S3 counters, and Sundays immediately upon each edit.'
  },
  R31: {
    name: 'S3 Shift Gap Minimization',
    description: 'Minimize the disparity of S3 late closing shifts between employees in the same comparison group.'
  },
  R32: {
    name: 'Sunday Shifts Disparity Minimization',
    description: 'Minimize the disparity of worked Sundays between comparable employees.'
  },
  R33: {
    name: 'Consolidated Coverage Deficit Alert',
    description: 'Display each coverage deficit synthetically by date and shift family.'
  },
  R34: {
    name: 'Silent Overwrite Protection',
    description: 'Any modification to an archived or published version requires creating a new version.'
  },
  R35: {
    name: 'Published Version Locking',
    description: 'A version marked as published is frozen as read-only for planners.'
  },
  R36: {
    name: 'Mandatory Override Traceability',
    description: 'Any exceptional bypass of a HARD rule must log reason, author, and timestamp.'
  },
  R37: {
    name: 'Imported Data Integrity Control',
    description: 'Orphan references or unknown codes are rejected with an audit report.'
  },
  R38: {
    name: 'Color Accessibility & Visual Redundancy',
    description: 'Information is never conveyed solely by color (text code, tooltip, and badge present).'
  },
  R39: {
    name: 'Unclarified Rules Classification',
    description: 'Any rule with pending semantics is tagged A_VALIDER without blocking schedule generation.'
  },
  R40: {
    name: 'Historic Versions Archiving',
    description: 'Old versions remain accessible in read-only mode for audit and comparison.'
  }
};

export const CATEGORIES_I18N: Record<string, { fr: string; en: string }> = {
  ALL: { fr: 'Toutes catégories', en: 'All Categories' },
  HABILITATION: { fr: 'Habilitations', en: 'Qualifications' },
  CONTRAT: { fr: 'Contrat & Légal', en: 'Contract & Legal' },
  SYSTEME: { fr: 'Système & Contrôles', en: 'System & Controls' },
  COUVERTURE: { fr: 'Couverture Opérationnelle', en: 'Operational Coverage' },
  REPOS: { fr: 'Repos & Récupération', en: 'Rest & Recovery' },
  AMPLITUDE: { fr: 'Amplitudes & Horaires', en: 'Work Spans & Hours' },
  EQUILIBRAGE: { fr: 'Équité & Équilibrage', en: 'Fairness & Balance' },
  ROTATION: { fr: 'Cycles & Rotations', en: 'Cycles & Rotations' },
  TRACABILITE: { fr: 'Traçabilité', en: 'Traceability' },
  ERGONOMIE: { fr: 'Ergonomie', en: 'Ergonomics' }
};

export const SHIFT_LABELS_EN: Record<string, string> = {
  M1: 'Morning 1 (Opening)',
  M2: 'Morning 2 (Standard)',
  M3: 'Morning 3 (Reinforcement)',
  J: 'Continuous Day',
  S1: 'Evening 1 (Handover)',
  S2: 'Evening 2 (Intermediate)',
  S3: 'Evening 3 (Late Closing)',
  N: 'Night (Vigil)',
  T: 'Training / Technical',
  OFF: 'Scheduled Rest',
  CP: 'Paid Leave',
  AM: 'Medical Leave',
  CSS: 'Unpaid Leave',
  CMF: 'Family Leave',
  REC: 'Compensatory Rest'
};

export const ROTATION_PATTERNS_EN: Record<string, { name: string; description: string }> = {
  'rot-1': {
    name: 'Standard Cycle 2M / 2S / 2OFF',
    description: 'Balanced alternating pattern: 2 mornings, 2 evenings, 2 consecutive rest days'
  },
  'rot-2': {
    name: 'Continuous Week Cycle 5W / 2OFF',
    description: '5 work days Monday to Friday, rest on weekends'
  }
};

export const GROUPS_EN: Record<string, string> = {
  'Opérateurs Principaux': 'Core Operators',
  'Opérateurs Polyvalents': 'Versatile Operators',
  'Techniciens de Relève': 'Handover Technicians',
  'Nouveaux Entrants': 'New Entrants',
  'Inactifs': 'Inactive'
};

export const TEAMS_EN: Record<string, string> = {
  'Équipe A': 'Team A',
  'Équipe B': 'Team B',
  'Équipe Polyvalente': 'Versatile Team',
  'Détachés': 'Seconded'
};
