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
  Assignment,
  PlanningVersion
} from '../types/planning';

export const INITIAL_SHIFTS: Shift[] = [
  {
    code: 'M1',
    label: 'Matin 1 (Ouverture)',
    startTime: '06:00',
    endTime: '14:00',
    isOvernight: false,
    theoreticalDuration: 8.0,
    countedHours: 7.5,
    family: 'M',
    subFamily: 'M1',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-amber-50',
    colorText: 'text-amber-900',
    colorBorder: 'border-amber-300',
    notes: 'Shift d’ouverture des installations'
  },
  {
    code: 'M2',
    label: 'Matin 2 (Standard)',
    startTime: '07:00',
    endTime: '15:30',
    isOvernight: false,
    theoreticalDuration: 8.5,
    countedHours: 7.5,
    family: 'M',
    subFamily: 'M2',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-yellow-50',
    colorText: 'text-yellow-900',
    colorBorder: 'border-yellow-300'
  },
  {
    code: 'M3',
    label: 'Matin 3 (Renfort)',
    startTime: '08:00',
    endTime: '16:30',
    isOvernight: false,
    theoreticalDuration: 8.5,
    countedHours: 7.5,
    family: 'M',
    subFamily: 'M3',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-lime-50',
    colorText: 'text-lime-900',
    colorBorder: 'border-lime-300'
  },
  {
    code: 'J',
    label: 'Journée Continue',
    startTime: '09:00',
    endTime: '17:30',
    isOvernight: false,
    theoreticalDuration: 8.5,
    countedHours: 7.5,
    family: 'J',
    subFamily: 'J',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-emerald-50',
    colorText: 'text-emerald-900',
    colorBorder: 'border-emerald-300'
  },
  {
    code: 'S1',
    label: 'Soir 1 (Relève)',
    startTime: '13:30',
    endTime: '21:30',
    isOvernight: false,
    theoreticalDuration: 8.0,
    countedHours: 7.5,
    family: 'S',
    subFamily: 'S1',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-900',
    colorBorder: 'border-blue-300'
  },
  {
    code: 'S2',
    label: 'Soir 2 (Intermédiaire)',
    startTime: '14:00',
    endTime: '22:30',
    isOvernight: false,
    theoreticalDuration: 8.5,
    countedHours: 7.5,
    family: 'S',
    subFamily: 'S2',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-indigo-50',
    colorText: 'text-indigo-900',
    colorBorder: 'border-indigo-300'
  },
  {
    code: 'S3',
    label: 'Soir 3 (Fermeture tardive)',
    startTime: '15:30',
    endTime: '23:45',
    isOvernight: false,
    theoreticalDuration: 8.25,
    countedHours: 7.5,
    family: 'S',
    subFamily: 'S3',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-violet-50',
    colorText: 'text-violet-900',
    colorBorder: 'border-violet-300',
    notes: 'Shift critique pour l’équilibrage de pénibilité'
  },
  {
    code: 'N',
    label: 'Nuit (Veille)',
    startTime: '22:00',
    endTime: '06:00',
    isOvernight: true,
    theoreticalDuration: 8.0,
    countedHours: 8.0,
    family: 'N',
    subFamily: 'N',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-slate-800',
    colorText: 'text-slate-100',
    colorBorder: 'border-slate-700',
    notes: 'Shift traversant minuit (rattaché au jour de début)'
  },
  {
    code: 'T',
    label: 'Formation / Technique',
    startTime: '08:30',
    endTime: '17:00',
    isOvernight: false,
    theoreticalDuration: 8.5,
    countedHours: 7.0,
    family: 'T',
    subFamily: 'T',
    type: 'travail',
    isActive: true,
    colorBg: 'bg-teal-50',
    colorText: 'text-teal-900',
    colorBorder: 'border-teal-300'
  },
  {
    code: 'OFF',
    label: 'Repos planifié',
    startTime: '00:00',
    endTime: '23:59',
    isOvernight: false,
    theoreticalDuration: 0,
    countedHours: 0,
    family: 'REPOS',
    subFamily: 'OFF',
    type: 'repos',
    isActive: true,
    colorBg: 'bg-stone-100',
    colorText: 'text-stone-600',
    colorBorder: 'border-stone-300'
  },
  {
    code: 'CP',
    label: 'Congés Payés',
    startTime: '00:00',
    endTime: '23:59',
    isOvernight: false,
    theoreticalDuration: 7.0,
    countedHours: 7.0,
    family: 'ABS',
    subFamily: 'CP',
    type: 'absence',
    isActive: true,
    colorBg: 'bg-rose-50',
    colorText: 'text-rose-800',
    colorBorder: 'border-rose-300'
  },
  {
    code: 'AM',
    label: 'Arrêt Maladie',
    startTime: '00:00',
    endTime: '23:59',
    isOvernight: false,
    theoreticalDuration: 0,
    countedHours: 0,
    family: 'ABS',
    subFamily: 'AM',
    type: 'absence',
    isActive: true,
    colorBg: 'bg-orange-50',
    colorText: 'text-orange-900',
    colorBorder: 'border-orange-300'
  },
  {
    code: 'CMF',
    label: 'Congé Maternité / Famille',
    startTime: '00:00',
    endTime: '23:59',
    isOvernight: false,
    theoreticalDuration: 7.0,
    countedHours: 7.0,
    family: 'ABS',
    subFamily: 'CMF',
    type: 'absence',
    isActive: true,
    colorBg: 'bg-pink-50',
    colorText: 'text-pink-900',
    colorBorder: 'border-pink-300'
  },
  {
    code: 'DPCT',
    label: 'Déplacement Chantier',
    startTime: '08:00',
    endTime: '17:30',
    isOvernight: false,
    theoreticalDuration: 9.5,
    countedHours: 7.5,
    family: 'AUTRE',
    subFamily: 'DPCT',
    type: 'statut',
    isActive: true,
    colorBg: 'bg-cyan-50',
    colorText: 'text-cyan-900',
    colorBorder: 'border-cyan-300'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-01',
    matricule: 'MAT-101',
    lastName: 'DUPONT',
    firstName: 'Marc',
    arrivalDate: '2023-01-15',
    isActive: true,
    team: 'Équipe A',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Principaux',
    notes: 'Référent d’équipe, habilité polyvalence totale'
  },
  {
    id: 'emp-02',
    matricule: 'MAT-102',
    lastName: 'BERNARD',
    firstName: 'Claire',
    arrivalDate: '2023-03-01',
    isActive: true,
    team: 'Équipe A',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Principaux'
  },
  {
    id: 'emp-03',
    matricule: 'MAT-103',
    lastName: 'LEROY',
    firstName: 'Alexandre',
    arrivalDate: '2023-05-10',
    departureDate: '2026-10-31',
    isActive: true,
    team: 'Équipe A',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Principaux',
    notes: 'Départ prévu en fin d’année'
  },
  {
    id: 'emp-04',
    matricule: 'MAT-104',
    lastName: 'MOREAU',
    firstName: 'Sophie',
    arrivalDate: '2023-09-01',
    isActive: true,
    team: 'Équipe A',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Principaux'
  },
  {
    id: 'emp-05',
    matricule: 'MAT-105',
    lastName: 'GIRARD',
    firstName: 'Thomas',
    arrivalDate: '2024-02-01',
    isActive: true,
    team: 'Équipe B',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Principaux'
  },
  {
    id: 'emp-06',
    matricule: 'MAT-106',
    lastName: 'ROUX',
    firstName: 'Camille',
    arrivalDate: '2024-04-15',
    isActive: true,
    team: 'Équipe B',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Polyvalents'
  },
  {
    id: 'emp-07',
    matricule: 'MAT-107',
    lastName: 'FOURNIER',
    firstName: 'Julien',
    arrivalDate: '2024-08-01',
    isActive: true,
    team: 'Équipe B',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Polyvalents'
  },
  {
    id: 'emp-08',
    matricule: 'MAT-108',
    lastName: 'LEFEBVRE',
    firstName: 'Élodie',
    arrivalDate: '2024-11-01',
    isActive: true,
    team: 'Équipe B',
    weeklyContractHours: 35,
    comparisonGroup: 'Opérateurs Polyvalents'
  },
  {
    id: 'emp-09',
    matricule: 'MAT-109',
    lastName: 'MERCIER',
    firstName: 'Lucas',
    arrivalDate: '2025-01-10',
    isActive: true,
    team: 'Équipe Polyvalente',
    weeklyContractHours: 35,
    comparisonGroup: 'Techniciens de Relève'
  },
  {
    id: 'emp-10',
    matricule: 'MAT-110',
    lastName: 'BONNET',
    firstName: 'Amélie',
    arrivalDate: '2025-04-01',
    isActive: true,
    team: 'Équipe Polyvalente',
    weeklyContractHours: 35,
    comparisonGroup: 'Techniciens de Relève',
    notes: 'Non habilitée S3 (fermeture de nuit)'
  },
  {
    id: 'emp-11',
    matricule: 'MAT-111',
    lastName: 'VINCENT',
    firstName: 'David',
    arrivalDate: '2026-09-15', // Arrivée mi-septembre 2026 ! Pour tester la règle R02 (aucune affectation avant entrée en fonction)
    isActive: true,
    team: 'Équipe Polyvalente',
    weeklyContractHours: 35,
    comparisonGroup: 'Nouveaux Entrants',
    notes: 'Entrée en fonction le 15/09/2026'
  },
  {
    id: 'emp-12',
    matricule: 'MAT-112',
    lastName: 'LAMBERT',
    firstName: 'Julie',
    arrivalDate: '2022-06-01',
    isActive: false, // Inactif pour tester le filtrage
    team: 'Détachés',
    weeklyContractHours: 35,
    comparisonGroup: 'Inactifs'
  }
];

export const INITIAL_QUALIFICATIONS: Qualification[] = [
  // emp-01 DUPONT: All authorized
  { employeeId: 'emp-01', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'M3', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'S2', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'S3', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'J', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'N', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'OFF', status: 'AUTHORIZED' },
  { employeeId: 'emp-01', shiftCode: 'CP', status: 'AUTHORIZED' },

  // emp-02 BERNARD: All authorized
  { employeeId: 'emp-02', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'M3', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'S2', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'S3', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'J', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'OFF', status: 'AUTHORIZED' },
  { employeeId: 'emp-02', shiftCode: 'CP', status: 'AUTHORIZED' },

  // emp-03 LEROY
  { employeeId: 'emp-03', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-03', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-03', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-03', shiftCode: 'S3', status: 'AUTHORIZED' },
  { employeeId: 'emp-03', shiftCode: 'J', status: 'AUTHORIZED' },
  { employeeId: 'emp-03', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-04 MOREAU: Not authorized for S3
  { employeeId: 'emp-04', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-04', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-04', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-04', shiftCode: 'S2', status: 'AUTHORIZED' },
  { employeeId: 'emp-04', shiftCode: 'S3', status: 'NOT_AUTHORIZED', conditionNote: 'Dispense médicale de nuit' },
  { employeeId: 'emp-04', shiftCode: 'J', status: 'AUTHORIZED' },
  { employeeId: 'emp-04', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-05 GIRARD
  { employeeId: 'emp-05', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-05', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-05', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-05', shiftCode: 'S3', status: 'AUTHORIZED' },
  { employeeId: 'emp-05', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-06 ROUX
  { employeeId: 'emp-06', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-06', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-06', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-06', shiftCode: 'S2', status: 'AUTHORIZED' },
  { employeeId: 'emp-06', shiftCode: 'S3', status: 'AUTHORIZED' },
  { employeeId: 'emp-06', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-07 FOURNIER
  { employeeId: 'emp-07', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-07', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-07', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-07', shiftCode: 'S3', status: 'AUTHORIZED' },
  { employeeId: 'emp-07', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-08 LEFEBVRE: Not authorized for S3
  { employeeId: 'emp-08', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-08', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-08', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-08', shiftCode: 'S3', status: 'NOT_AUTHORIZED', conditionNote: 'Formation fermeture non validée' },
  { employeeId: 'emp-08', shiftCode: 'J', status: 'AUTHORIZED' },
  { employeeId: 'emp-08', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-09 MERCIER
  { employeeId: 'emp-09', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-09', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-09', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-09', shiftCode: 'S3', status: 'AUTHORIZED' },
  { employeeId: 'emp-09', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-10 BONNET: explicitly NOT authorized for S3
  { employeeId: 'emp-10', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-10', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-10', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-10', shiftCode: 'S3', status: 'NOT_AUTHORIZED', conditionNote: 'Interdiction fermeture tardive' },
  { employeeId: 'emp-10', shiftCode: 'J', status: 'AUTHORIZED' },
  { employeeId: 'emp-10', shiftCode: 'OFF', status: 'AUTHORIZED' },

  // emp-11 VINCENT: Authorized after arrival
  { employeeId: 'emp-11', shiftCode: 'M1', status: 'AUTHORIZED' },
  { employeeId: 'emp-11', shiftCode: 'M2', status: 'AUTHORIZED' },
  { employeeId: 'emp-11', shiftCode: 'S1', status: 'AUTHORIZED' },
  { employeeId: 'emp-11', shiftCode: 'OFF', status: 'AUTHORIZED' }
];

export const INITIAL_COVERAGE: CoverageRequirement[] = [
  { id: 'cov-1', date: 'DEFAULT_WEEKDAY', subFamily: 'M1', minimum: 1, maximum: 2, priority: 'HAUTE' },
  { id: 'cov-2', date: 'DEFAULT_WEEKDAY', subFamily: 'M2', minimum: 1, maximum: 3, priority: 'HAUTE' },
  { id: 'cov-3', date: 'DEFAULT_WEEKDAY', subFamily: 'S1', minimum: 1, maximum: 2, priority: 'HAUTE' },
  { id: 'cov-4', date: 'DEFAULT_WEEKDAY', subFamily: 'S3', minimum: 1, maximum: 2, priority: 'HAUTE' },
  { id: 'cov-5', date: 'DEFAULT_WEEKEND', subFamily: 'M1', minimum: 1, maximum: 1, priority: 'HAUTE' },
  { id: 'cov-6', date: 'DEFAULT_WEEKEND', subFamily: 'M2', minimum: 1, maximum: 2, priority: 'HAUTE' },
  { id: 'cov-7', date: 'DEFAULT_WEEKEND', subFamily: 'S1', minimum: 1, maximum: 1, priority: 'HAUTE' },
  { id: 'cov-8', date: 'DEFAULT_WEEKEND', subFamily: 'S3', minimum: 1, maximum: 1, priority: 'HAUTE' }
];

export const INITIAL_PAY_PERIODS: PayPeriod[] = [
  {
    id: 'period-2026-08',
    number: 8,
    year: 2026,
    startDate: '2026-07-26',
    endDate: '2026-08-25',
    label: 'Période de Paie Août 2026 (26/07 - 25/08)',
    status: 'CLOSED'
  },
  {
    id: 'period-2026-09',
    number: 9,
    year: 2026,
    startDate: '2026-08-26',
    endDate: '2026-09-25',
    label: 'Période de Paie Septembre 2026 (26/08 - 25/09)',
    status: 'OPEN'
  },
  {
    id: 'period-2026-10',
    number: 10,
    year: 2026,
    startDate: '2026-09-26',
    endDate: '2026-10-25',
    label: 'Période de Paie Octobre 2026 (26/09 - 25/10)',
    status: 'OPEN'
  }
];

export const INITIAL_ROTATION_PATTERNS: RotationPattern[] = [
  {
    id: 'rot-1',
    name: 'Cycle standard 2M / 2S / 2OFF',
    description: 'Alternance équilibrée 2 matins, 2 soirs, 2 repos consécutifs',
    cycleLength: 6,
    isActive: true,
    steps: [
      { dayIndex: 0, requiredFamily: 'M', suggestedShiftCode: 'M1', isRest: false },
      { dayIndex: 1, requiredFamily: 'M', suggestedShiftCode: 'M2', isRest: false },
      { dayIndex: 2, requiredFamily: 'S', suggestedShiftCode: 'S1', isRest: false },
      { dayIndex: 3, requiredFamily: 'S', suggestedShiftCode: 'S3', isRest: false },
      { dayIndex: 4, requiredFamily: 'OFF', suggestedShiftCode: 'OFF', isRest: true },
      { dayIndex: 5, requiredFamily: 'OFF', suggestedShiftCode: 'OFF', isRest: true }
    ]
  },
  {
    id: 'rot-2',
    name: 'Cycle Semaine Continue 5T / 2OFF',
    description: '5 jours travaillés du lundi au vendredi, repos le week-end',
    cycleLength: 7,
    isActive: true,
    steps: [
      { dayIndex: 0, requiredFamily: 'M', suggestedShiftCode: 'M2', isRest: false },
      { dayIndex: 1, requiredFamily: 'M', suggestedShiftCode: 'M2', isRest: false },
      { dayIndex: 2, requiredFamily: 'J', suggestedShiftCode: 'J', isRest: false },
      { dayIndex: 3, requiredFamily: 'S', suggestedShiftCode: 'S1', isRest: false },
      { dayIndex: 4, requiredFamily: 'M', suggestedShiftCode: 'M1', isRest: false },
      { dayIndex: 5, requiredFamily: 'OFF', suggestedShiftCode: 'OFF', isRest: true },
      { dayIndex: 6, requiredFamily: 'OFF', suggestedShiftCode: 'OFF', isRest: true }
    ]
  }
];

export const INITIAL_RULES: RuleDefinition[] = [
  {
    id: 'R01',
    code: 'HABILITATION',
    name: 'Habilitation de Shift',
    description: 'Un employé ne peut être affecté qu’à un code autorisé dans sa matrice d’habilitation.',
    category: 'HABILITATION',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: { allowAdminOverride: true },
    explanationTemplate: 'L’employé {employee} n’est pas habilité pour le shift {shift}.'
  },
  {
    id: 'R02',
    code: 'DATE_ARRIVEE',
    name: 'Date d’entrée en fonction',
    description: 'Aucune affectation de travail ou présence avant la date d’arrivée contractuelle.',
    category: 'CONTRAT',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'La date {date} est antérieure à l’arrivée de l’employé {employee} ({arrivalDate}).'
  },
  {
    id: 'R03',
    code: 'DATE_DEPART',
    name: 'Date de sortie d’effectif',
    description: 'Aucune affectation après la date de départ déclarée.',
    category: 'CONTRAT',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'La date {date} est postérieure au départ de l’employé {employee} ({departureDate}).'
  },
  {
    id: 'R04',
    code: 'UN_PAR_JOUR',
    name: 'Affectation unique par jour',
    description: 'Un employé ne peut avoir qu’une seule affectation principale par journée.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'L’employé {employee} possède déjà une affectation ({existingShift}) à la date {date}.'
  },
  {
    id: 'R05',
    code: 'CHOIX_CONTEXTUELS',
    name: 'Choix de codes contextuels',
    description: 'La liste des codes proposés dépend strictement des habilitations et du profil actif.',
    category: 'HABILITATION',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Sélection filtrée selon le profil métier de l’agent.'
  },
  {
    id: 'R06',
    code: 'COUVERTURE_M1',
    name: 'Couverture minimale M1',
    description: 'Atteindre le nombre minimal de shifts M1 paramétré pour assurer l’ouverture.',
    category: 'COUVERTURE',
    defaultLevel: 'WARNING',
    currentLevel: 'WARNING',
    isEnabled: true,
    parameters: { minCount: 1 },
    explanationTemplate: 'Déficit M1 à la date {date} : {actual}/{required} assigné(s).'
  },
  {
    id: 'R07',
    code: 'COUVERTURE_M2',
    name: 'Couverture minimale M2',
    description: 'Atteindre le minimum M2 requis pour les opérations courantes du matin.',
    category: 'COUVERTURE',
    defaultLevel: 'WARNING',
    currentLevel: 'WARNING',
    isEnabled: true,
    parameters: { minCount: 1 },
    explanationTemplate: 'Déficit M2 à la date {date} : {actual}/{required} assigné(s).'
  },
  {
    id: 'R08',
    code: 'COUVERTURE_S1',
    name: 'Couverture minimale S1',
    description: 'Atteindre le minimum S1 pour la relève de l’après-midi.',
    category: 'COUVERTURE',
    defaultLevel: 'WARNING',
    currentLevel: 'WARNING',
    isEnabled: true,
    parameters: { minCount: 1 },
    explanationTemplate: 'Déficit S1 à la date {date} : {actual}/{required} assigné(s).'
  },
  {
    id: 'R09',
    code: 'COUVERTURE_S3',
    name: 'Couverture minimale S3',
    description: 'Atteindre le minimum S3 pour sécuriser la fermeture tardive.',
    category: 'COUVERTURE',
    defaultLevel: 'WARNING',
    currentLevel: 'WARNING',
    isEnabled: true,
    parameters: { minCount: 1 },
    explanationTemplate: 'Déficit S3 à la date {date} : {actual}/{required} assigné(s).'
  },
  {
    id: 'R10',
    code: 'SEUIL_J1_J2',
    name: 'Séquence indésirable J1/J2',
    description: 'Détecte la succession indésirable de vacations lourdes consécutives sans repos suffisant.',
    category: 'ROTATION',
    defaultLevel: 'WARNING',
    currentLevel: 'WARNING',
    isEnabled: true,
    parameters: { maxConsecutiveLate: 2 },
    explanationTemplate: 'Séquence lourde détectée pour {employee} ({details}).'
  },
  {
    id: 'R11',
    code: 'SEUIL_CP',
    name: 'Seuil de congés simultanés',
    description: 'Alerter si le nombre d’agents en CP le même jour dépasse le quota admissible.',
    category: 'COUVERTURE',
    defaultLevel: 'WARNING',
    currentLevel: 'WARNING',
    isEnabled: true,
    parameters: { maxSimultaneousCP: 2 },
    explanationTemplate: '{count} employés en congés le {date} (seuil max : {max}).'
  },
  {
    id: 'R12',
    code: 'COMPTAGE_S3',
    name: 'Comptage individuel S3',
    description: 'Mesurer le nombre de vacations S3 par employé pour prévenir l’asymétrie.',
    category: 'EQUILIBRAGE',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Total S3 : {count} pour {employee}.'
  },
  {
    id: 'R13',
    code: 'COMPTAGE_DIMANCHES',
    name: 'Comptage dimanches travaillés',
    description: 'Comptabiliser les dimanches travaillés par employé pour équilibrage.',
    category: 'EQUILIBRAGE',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Dimanches travaillés : {count} pour {employee}.'
  },
  {
    id: 'R14',
    code: 'CALCUL_HEURES',
    name: 'Totalisation des heures comptabilisées',
    description: 'Additionner les heures réelles comptabilisées définies dans le référentiel des shifts.',
    category: 'SYSTEME',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Total heures calculé automatiquement.'
  },
  {
    id: 'R15',
    code: 'DUREE_VS_PAYEES',
    name: 'Dissociation durée théorique vs heures payées',
    description: 'Ne jamais déduire les heures payées uniquement de l’amplitude début-fin sans passer par countedHours.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Application rigoureuse de la valeur countedHours du shift.'
  },
  {
    id: 'R16',
    code: 'PERIODES_PAIE',
    name: 'Période de paie non civile',
    description: 'Calculer les heures selon les dates de la période de paie paramétrée et non le mois civil.',
    category: 'CONTRAT',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Rattachement à la période de paie {periodLabel}.'
  },
  {
    id: 'R17',
    code: 'JOURS_TRAVAIL_SEMAINE',
    name: 'Cible de jours travaillés par semaine',
    description: 'Viser une moyenne cible d’environ 4,5 à 5 jours travaillés par semaine.',
    category: 'EQUILIBRAGE',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { targetWeeklyWorkDays: 4.5 },
    explanationTemplate: 'Moyenne observée : {actual} j/semaine (cible {target}).'
  },
  {
    id: 'R18',
    code: 'JOURS_REPOS_SEMAINE',
    name: 'Cible de jours de repos par semaine',
    description: 'Viser une moyenne cible d’environ 2,5 à 2 jours de repos par semaine.',
    category: 'EQUILIBRAGE',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { targetWeeklyRestDays: 2.5 },
    explanationTemplate: 'Moyenne observée : {actual} j repos/semaine (cible {target}).'
  },
  {
    id: 'R19',
    code: 'TAUX_PRESENCE',
    name: 'Taux de présence cible',
    description: 'Optimiser le taux de présence sans bloquer par défaut.',
    category: 'EQUILIBRAGE',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { targetPresencePercent: 85 },
    explanationTemplate: 'Taux de présence : {actual}%.'
  },
  {
    id: 'R20',
    code: 'DENSITE_VACATIONS',
    name: 'Densité de vacations',
    description: 'Éviter les ruptures excessives ou les isolations de vacations uniques.',
    category: 'ROTATION',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { maxConsecutiveWorkDays: 6 },
    explanationTemplate: 'Densité lissée sur la quinzaine.'
  },
  {
    id: 'R21',
    code: 'DUREE_MOYENNE_VACATION',
    name: 'Durée moyenne de vacation',
    description: 'Viser une durée moyenne conforme aux standards du site (ex: 7.5h).',
    category: 'EQUILIBRAGE',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { targetShiftHours: 7.5 },
    explanationTemplate: 'Moyenne : {actual}h / vacation.'
  },
  {
    id: 'R22',
    code: 'CYCLE_ROTATION',
    name: 'Respect de la grille de cycle',
    description: 'Suivre le pattern de rotation configuré pour les agents assignés.',
    category: 'ROTATION',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { enforceStrict: false },
    explanationTemplate: 'Adhérence au motif de rotation : {score}%.'
  },
  {
    id: 'R23',
    code: 'SEQUENCE_ON_OFF',
    name: 'Séquences présence et repos',
    description: 'Garantir au moins 1 jour de repos consécutif après au maximum 6 jours travaillés.',
    category: 'ROTATION',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: { maxConsecutiveWorkDays: 6, minRestAfterStreak: 1 },
    explanationTemplate: 'Violation : plus de 6 jours travaillés consécutifs pour {employee}.'
  },
  {
    id: 'R24',
    code: 'FAMILLES_M_S_J_N',
    name: 'Distinction familles et codes détaillés',
    description: 'Distinguer la famille fonctionnelle (M, S, J, N) du code de vacation précis.',
    category: 'SYSTEME',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Agrégation par famille.'
  },
  {
    id: 'R25',
    code: 'STATUTS_ABSENCE',
    name: 'Statuts d’absence et non-travail',
    description: 'CP, AM, OFF, CMF, etc. possèdent leurs propres règles de calcul d’heures et de disponibilité.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Calcul conforme au barème d’absence.'
  },
  {
    id: 'R26',
    code: 'SHIFTS_NUIT',
    name: 'Rattachement des shifts traversant minuit',
    description: 'Le shift de nuit (ex: 22h-06h) reste rattaché comptablement et visuellement à sa date de début.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Le shift N débutant le {date} est imputé au {date}.'
  },
  {
    id: 'R27',
    code: 'S3_NUIT',
    name: 'Continuité des vacations tardives S3',
    description: 'Assurer un repos suffisant (au moins 11h) entre un shift S3 (fin 23h45) et un shift matinal M1/M2 le lendemain.',
    category: 'ROTATION',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: { minRestHoursBetweenShifts: 11 },
    explanationTemplate: 'Repos inter-shift insuffisant ({restHours}h < 11h) entre {previousShift} et {nextShift} pour {employee}.'
  },
  {
    id: 'R28',
    code: 'ANNOTATIONS',
    name: 'Annotations et commentaires historisés',
    description: 'Permettre d’attacher une note explicative à toute affectation ou journée.',
    category: 'SYSTEME',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Commentaire utilisateur enregistré.'
  },
  {
    id: 'R29',
    code: 'DIFF_VERSIONS',
    name: 'Comparateur d’écarts entre versions',
    description: 'Afficher les modifications de cellules, de volumes horaires et de compteurs entre versions.',
    category: 'SYSTEME',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Calcul dynamique du différentiel.'
  },
  {
    id: 'R30',
    code: 'RECALCUL_TEMPS_REEL',
    name: 'Recalcul instantané des totaux',
    description: 'Recalculer les heures, compteurs S3 et dimanches immédiatement à chaque saisie.',
    category: 'SYSTEME',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Recalcul instantané actif.'
  },
  {
    id: 'R31',
    code: 'EQUILIBRAGE_S3',
    name: 'Minimisation de l’écart de S3',
    description: 'Minimiser l’écart du nombre de fermetures S3 entre employés du même groupe de comparaison.',
    category: 'EQUILIBRAGE',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { maxAllowedDeltaS3: 2 },
    explanationTemplate: 'Écart de S3 ({delta}) supérieur au seuil visé ({targetMax}) dans le groupe {group}.'
  },
  {
    id: 'R32',
    code: 'EQUILIBRAGE_DIMANCHES',
    name: 'Minimisation de l’écart de dimanches',
    description: 'Minimiser l’écart de dimanches travaillés entre employés comparables.',
    category: 'EQUILIBRAGE',
    defaultLevel: 'OPTIMISATION',
    currentLevel: 'OPTIMISATION',
    isEnabled: true,
    parameters: { maxAllowedDeltaSunday: 1 },
    explanationTemplate: 'Écart de dimanches ({delta}) à équilibrer dans le groupe {group}.'
  },
  {
    id: 'R33',
    code: 'SYNTHESE_DEFICIT_COUVERTURE',
    name: 'Signalement consolidé des déficits',
    description: 'Afficher chaque déficit de couverture de façon synthétique par date et famille.',
    category: 'COUVERTURE',
    defaultLevel: 'WARNING',
    currentLevel: 'WARNING',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Déficits détectés sur {count} créneau(x).'
  },
  {
    id: 'R34',
    code: 'VERSIONING_SECURITE',
    name: 'Protection contre écrasement silencieux',
    description: 'Toute modification d’une version archivée ou publiée exige la création d’une nouvelle version.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Impossible d’écraser directement la version protégée {version}.'
  },
  {
    id: 'R35',
    code: 'VERROU_PUBLICATION',
    name: 'Verrouillage de la version publiée',
    description: 'Une version marquée comme publiée est figée en lecture seule pour les planificateurs.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Cette version est publiée et ne peut être modifiée qu’en dérivant une nouvelle version.'
  },
  {
    id: 'R36',
    code: 'TRAÇABILITE_OVERRIDE',
    name: 'Traçabilité obligatoire des overrides',
    description: 'Tout contournement exceptionnel d’une règle HARD doit enregistrer le motif, l’auteur et l’heure.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Dérogation enregistrée avec justification.'
  },
  {
    id: 'R37',
    code: 'NETTOYAGE_LEGACY',
    name: 'Contrôle d’intégrité des données importées',
    description: 'Les références orphelines ou codes inconnus sont rejetés avec rapport d’audit.',
    category: 'SYSTEME',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Rapport d’intégrité généré.'
  },
  {
    id: 'R38',
    code: 'ACCESSIBILITE_COULEURS',
    name: 'Accessibilité et redondance visuelle',
    description: 'L’information ne repose jamais uniquement sur la couleur (code texte, tooltip et badge présents).',
    category: 'SYSTEME',
    defaultLevel: 'INFO',
    currentLevel: 'INFO',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Normes d’accessibilité respectées.'
  },
  {
    id: 'R39',
    code: 'REGLE_A_VALIDER',
    name: 'Traitement des règles non clarifiées',
    description: 'Toute règle dont la sémantique n’est pas certaine est classée A_VALIDER sans bloquer la génération.',
    category: 'SYSTEME',
    defaultLevel: 'A_VALIDER',
    currentLevel: 'A_VALIDER',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Règle en cours de confirmation métier.'
  },
  {
    id: 'R40',
    code: 'ARCHIVAGE_HISTORIQUE',
    name: 'Conservation et consultation des versions historiques',
    description: 'Les anciennes versions restent accessibles en lecture seule pour comparaison et audit.',
    category: 'SYSTEME',
    defaultLevel: 'HARD',
    currentLevel: 'HARD',
    isEnabled: true,
    parameters: {},
    explanationTemplate: 'Historique pérenne.'
  }
];

// Seed an initial working month: September 2026 (matching current local time)
export function createSampleAssignments(startDate: string, endDate: string): Assignment[] {
  const assignments: Assignment[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Deterministic seed pattern
  const activeEmployees = INITIAL_EMPLOYEES.filter(e => e.isActive && e.id !== 'emp-11'); // emp-11 arrives 2026-09-15
  
  const current = new Date(start);
  let dayIdx = 0;
  
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Assign shifts to fulfill coverage
    // emp-01: M1 or M2
    // emp-02: M2 or OFF
    // emp-03: S1
    // emp-05: S3 (authorized)
    // emp-06: M1 or S1
    // emp-07: S3 or OFF
    // emp-08: M2 or J
    // emp-09: S1 or S3
    // emp-10: J or M1 (never S3!)
    
    activeEmployees.forEach((emp, empIdx) => {
      let code = 'OFF';
      let hours = 0;
      
      const patternIdx = (dayIdx + empIdx * 2) % 6;
      
      if (patternIdx === 0) {
        code = 'M1';
        hours = 7.5;
      } else if (patternIdx === 1) {
        code = 'M2';
        hours = 7.5;
      } else if (patternIdx === 2) {
        code = 'S1';
        hours = 7.5;
      } else if (patternIdx === 3) {
        // Only assign S3 if authorized!
        if (emp.id === 'emp-04' || emp.id === 'emp-08' || emp.id === 'emp-10') {
          code = 'S1';
        } else {
          code = 'S3';
        }
        hours = 7.5;
      } else {
        code = 'OFF';
        hours = 0;
      }

      // Add a realistic CP for emp-04 for a couple days
      if (emp.id === 'emp-04' && dayIdx >= 8 && dayIdx <= 11) {
        code = 'CP';
        hours = 7.0;
      }
      
      assignments.push({
        id: `asg-${dateStr}-${emp.id}`,
        date: dateStr,
        employeeId: emp.id,
        shiftCode: code,
        countedHours: hours,
        source: 'manual',
        author: 'Responsable Opérationnel',
        timestamp: new Date().toISOString()
      });
    });
    
    // Advance 1 day
    current.setDate(current.getDate() + 1);
    dayIdx++;
  }
  
  return assignments;
}

export const INITIAL_PLANNING_VERSION: PlanningVersion = {
  id: 'ver-2026-09-v1',
  name: 'Planning Opérationnel - Septembre 2026',
  periodId: 'period-2026-09',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  versionNumber: 1,
  status: 'DRAFT',
  author: 'Chef d’équipe Opérations',
  createdAt: '2026-09-01T08:00:00Z',
  updatedAt: new Date().toISOString(),
  comment: 'Version initiale de travail avec couverture des créneaux M1, M2, S1, S3',
  source: 'MANUAL',
  assignments: createSampleAssignments('2026-09-01', '2026-09-30'),
  validationScore: 94,
  hardViolationsCount: 0,
  warningsCount: 2
};
