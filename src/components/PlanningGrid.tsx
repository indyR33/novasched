/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  Info,
  Sparkles,
  Calendar,
  CalendarDays,
  RotateCcw,
  X,
  Check
} from 'lucide-react';
import {
  Employee,
  Shift,
  Assignment,
  PlanningVersion,
  UserRole,
  ValidationIssue,
  Qualification,
  CoverageRequirement,
  PayPeriod
} from '../types/planning';
import { EmployeePeriodStats, DailyCoverageStatus } from '../engine/rulesEngine';
import { TEAMS_EN, GROUPS_EN, SHIFT_LABELS_EN } from '../utils/i18nData';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const MONTHS_SHORT_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTHS_SHORT_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const WEEKDAYS_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_PAY_PERIODS: PayPeriod[] = [
  {
    id: 'period-2026-08',
    number: 8,
    year: 2026,
    startDate: '2026-07-26',
    endDate: '2026-08-25',
    label: 'Période Paie Août 2026 (26/07 - 25/08)',
    status: 'CLOSED'
  },
  {
    id: 'period-2026-09',
    number: 9,
    year: 2026,
    startDate: '2026-08-26',
    endDate: '2026-09-25',
    label: 'Période Paie Septembre 2026 (26/08 - 25/09)',
    status: 'OPEN'
  },
  {
    id: 'period-2026-10',
    number: 10,
    year: 2026,
    startDate: '2026-09-26',
    endDate: '2026-10-25',
    label: 'Période Paie Octobre 2026 (26/09 - 25/10)',
    status: 'OPEN'
  }
];

const formatIsoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
};

interface PlanningGridProps {
  version: PlanningVersion;
  employees: Employee[];
  shifts: Shift[];
  qualifications?: Qualification[];
  coverageRequirements?: CoverageRequirement[];
  payPeriods?: PayPeriod[];
  statsByEmployee?: Record<string, EmployeePeriodStats>;
  dailyCoverage?: Record<string, DailyCoverageStatus>;
  issues?: ValidationIssue[];
  evaluationIssues?: ValidationIssue[];
  userRole: UserRole;
  onSelectCell: (employee: Employee, date: string, currentAssignment?: Assignment) => void;
  onQuickAssign?: (employeeId: string, date: string, shiftCode: string) => void;
  onOpenGenerator?: () => void;
  onOpenValidation?: () => void;
}

export const PlanningGrid: React.FC<PlanningGridProps> = ({
  version,
  employees,
  shifts,
  payPeriods = [],
  statsByEmployee = {},
  dailyCoverage = {},
  issues = [],
  evaluationIssues = [],
  userRole,
  onSelectCell,
  onQuickAssign
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  
  // View mode: 2-Months, Month, 14-days (Fortnight), Week, or Custom Range
  const [viewMode, setViewMode] = useState<'TWO_MONTHS' | 'MONTH' | 'FORTNIGHT' | 'WEEK' | 'CUSTOM'>('MONTH');

  // Active date cursor for navigating through calendar
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const sStr = version?.startDate || '2026-09-01';
    const parts = sStr.split('-').map(Number);
    return new Date(parts[0], (parts[1] || 9) - 1, parts[2] || 1);
  });

  // Custom date window (for custom range & pay periods)
  const [customStartDate, setCustomStartDate] = useState<string>(version?.startDate || '2026-09-01');
  const [customEndDate, setCustomEndDate] = useState<string>(version?.endDate || '2026-09-30');

  // Interactive calendar popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(() => {
    const sStr = version?.startDate || '2026-09-01';
    return Number(sStr.split('-')[0]) || 2026;
  });
  const [calendarMonth, setCalendarMonth] = useState<number>(() => {
    const sStr = version?.startDate || '2026-09-01';
    return (Number(sStr.split('-')[1]) || 9) - 1;
  });
  const [calendarTab, setCalendarTab] = useState<'MONTHS' | 'PRESETS' | 'CUSTOM'>('MONTHS');

  // Form state for custom range inputs
  const [inputStart, setInputStart] = useState<string>(version?.startDate || '2026-09-01');
  const [inputEnd, setInputEnd] = useState<string>(version?.endDate || '2026-09-30');

  const [activeBrush, setActiveBrush] = useState<string | null>(null);
  const [isPainting, setIsPainting] = useState<boolean>(false);

  const isReadOnly = userRole === 'VIEWER' || version.status === 'PUBLISHED' || version.status === 'ARCHIVED';
  const actualIssues = issues && issues.length > 0 ? issues : (evaluationIssues || []);
  const effectivePayPeriods = payPeriods && payPeriods.length > 0 ? payPeriods : DEFAULT_PAY_PERIODS;

  // Build shift lookup map
  const shiftMap = useMemo(() => new Map<string, Shift>(shifts.map(s => [s.code, s])), [shifts]);

  // Build assignments map
  const assignmentsMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    (version?.assignments || []).forEach(a => {
      map.set(`${a.employeeId}_${a.date}`, a);
      map.set(`${a.employeeId}-${a.date}`, a);
    });
    return map;
  }, [version?.assignments]);

  // Build issue map
  const issuesMap = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    (actualIssues || []).forEach(issue => {
      if (issue?.employeeId && issue?.date) {
        const kUnderscore = `${issue.employeeId}_${issue.date}`;
        const kHyphen = `${issue.employeeId}-${issue.date}`;
        const list = map.get(kUnderscore) || [];
        list.push(issue);
        map.set(kUnderscore, list);
        map.set(kHyphen, list);
      }
    });
    return map;
  }, [actualIssues]);

  // Generate displayed dates dynamically based on viewMode and selected calendar window
  const displayedDates = useMemo(() => {
    const dates: string[] = [];
    if (viewMode === 'TWO_MONTHS') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      // Month 1
      const lastDay1 = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= lastDay1; day++) {
        dates.push(formatIsoDate(new Date(year, month, day)));
      }
      // Month 2
      const nextMonthDate = new Date(year, month + 1, 1);
      const year2 = nextMonthDate.getFullYear();
      const month2 = nextMonthDate.getMonth();
      const lastDay2 = new Date(year2, month2 + 1, 0).getDate();
      for (let day = 1; day <= lastDay2; day++) {
        dates.push(formatIsoDate(new Date(year2, month2, day)));
      }
    } else if (viewMode === 'MONTH') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        dates.push(formatIsoDate(new Date(year, month, day)));
      }
    } else if (viewMode === 'WEEK') {
      // Find Monday of current week
      const d = new Date(currentDate);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
      const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      for (let i = 0; i < 7; i++) {
        const cur = new Date(monday);
        cur.setDate(monday.getDate() + i);
        dates.push(formatIsoDate(cur));
      }
    } else if (viewMode === 'FORTNIGHT') {
      // Find Monday of current week and show 14 days
      const d = new Date(currentDate);
      const dayOfWeek = d.getDay();
      const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      for (let i = 0; i < 14; i++) {
        const cur = new Date(monday);
        cur.setDate(monday.getDate() + i);
        dates.push(formatIsoDate(cur));
      }
    } else if (viewMode === 'CUSTOM') {
      const sParts = customStartDate.split('-').map(Number);
      const eParts = customEndDate.split('-').map(Number);
      const start = new Date(sParts[0], (sParts[1] || 1) - 1, sParts[2] || 1);
      const end = new Date(eParts[0], (eParts[1] || 1) - 1, eParts[2] || 1);
      if (start <= end) {
        const cur = new Date(start);
        let count = 0;
        while (cur <= end && count < 62) {
          dates.push(formatIsoDate(cur));
          cur.setDate(cur.getDate() + 1);
          count++;
        }
      }
    }
    return dates.length > 0 ? dates : [formatIsoDate(currentDate)];
  }, [viewMode, currentDate, customStartDate, customEndDate]);

  // Label summarizing active displayed date window
  const activePeriodLabel = useMemo(() => {
    if (viewMode === 'TWO_MONTHS') {
      const mNames = isEn ? MONTHS_EN : MONTHS_FR;
      const m1 = currentDate.getMonth();
      const y1 = currentDate.getFullYear();
      const nextMonthDate = new Date(y1, m1 + 1, 1);
      const m2 = nextMonthDate.getMonth();
      const y2 = nextMonthDate.getFullYear();
      if (y1 === y2) {
        return `${mNames[m1]} – ${mNames[m2]} ${y1}`;
      }
      return `${mNames[m1]} ${y1} – ${mNames[m2]} ${y2}`;
    }
    if (viewMode === 'MONTH') {
      const mNames = isEn ? MONTHS_EN : MONTHS_FR;
      return `${mNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'WEEK') {
      const s = displayedDates[0];
      const e = displayedDates[displayedDates.length - 1];
      return `${isEn ? 'Week' : 'Semaine'} • ${formatDisplayDate(s)} – ${formatDisplayDate(e)} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'FORTNIGHT') {
      const s = displayedDates[0];
      const e = displayedDates[displayedDates.length - 1];
      return `${isEn ? '14 Days' : '14 Jours'} • ${formatDisplayDate(s)} – ${formatDisplayDate(e)}`;
    }
    if (viewMode === 'CUSTOM') {
      return `${formatDisplayDate(customStartDate)} – ${formatDisplayDate(customEndDate)} ${customEndDate.split('-')[0] || ''}`;
    }
    return '';
  }, [viewMode, currentDate, displayedDates, customStartDate, customEndDate, isEn]);

  // Navigation handlers
  const handlePrevPeriod = () => {
    if (viewMode === 'TWO_MONTHS') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 2);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'MONTH') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'WEEK') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'FORTNIGHT') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 14);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'CUSTOM') {
      const sParts = customStartDate.split('-').map(Number);
      const eParts = customEndDate.split('-').map(Number);
      const s = new Date(sParts[0], (sParts[1] || 1) - 1, sParts[2] || 1);
      const e = new Date(eParts[0], (eParts[1] || 1) - 1, eParts[2] || 1);
      const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      s.setDate(s.getDate() - days);
      e.setDate(e.getDate() - days);
      const nextS = formatIsoDate(s);
      const nextE = formatIsoDate(e);
      setCustomStartDate(nextS);
      setCustomEndDate(nextE);
      setInputStart(nextS);
      setInputEnd(nextE);
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'TWO_MONTHS') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 2);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'MONTH') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'WEEK') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'FORTNIGHT') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 14);
      setCurrentDate(d);
      setCalendarYear(d.getFullYear());
      setCalendarMonth(d.getMonth());
    } else if (viewMode === 'CUSTOM') {
      const sParts = customStartDate.split('-').map(Number);
      const eParts = customEndDate.split('-').map(Number);
      const s = new Date(sParts[0], (sParts[1] || 1) - 1, sParts[2] || 1);
      const e = new Date(eParts[0], (eParts[1] || 1) - 1, eParts[2] || 1);
      const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      s.setDate(s.getDate() + days);
      e.setDate(e.getDate() + days);
      const nextS = formatIsoDate(s);
      const nextE = formatIsoDate(e);
      setCustomStartDate(nextS);
      setCustomEndDate(nextE);
      setInputStart(nextS);
      setInputEnd(nextE);
    }
  };

  const handleResetToVersionPeriod = () => {
    const sStr = version?.startDate || '2026-09-01';
    const eStr = version?.endDate || '2026-09-30';
    const parts = sStr.split('-').map(Number);
    const d = new Date(parts[0], (parts[1] || 9) - 1, parts[2] || 1);
    setCurrentDate(d);
    setCalendarYear(parts[0]);
    setCalendarMonth((parts[1] || 9) - 1);
    setCustomStartDate(sStr);
    setCustomEndDate(eStr);
    setInputStart(sStr);
    setInputEnd(eStr);
    setViewMode('MONTH');
    setIsCalendarOpen(false);
  };

  const handleSelectMonth = (monthIdx: number) => {
    const d = new Date(calendarYear, monthIdx, 1);
    setCurrentDate(d);
    setCalendarMonth(monthIdx);
    setViewMode('MONTH');
    setIsCalendarOpen(false);
  };

  const handleSelectDay = (dayNum: number) => {
    const d = new Date(calendarYear, calendarMonth, dayNum);
    setCurrentDate(d);
    setIsCalendarOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (inputStart && inputEnd) {
      if (inputStart <= inputEnd) {
        setCustomStartDate(inputStart);
        setCustomEndDate(inputEnd);
      } else {
        setCustomStartDate(inputEnd);
        setCustomEndDate(inputStart);
      }
      setViewMode('CUSTOM');
      setIsCalendarOpen(false);
    }
  };

  // Mini calendar days calculation for the popover picker
  const miniCalendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    let startDayOfWeek = firstDay.getDay(); // 0 is Sun, 1 is Mon...
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon = 0, Sun = 6
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: Array<{ day: number; isCurrentMonth: boolean; dateStr: string }> = [];

    // Prev month padding
    const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(calendarYear, calendarMonth - 1, d);
      days.push({ day: d, isCurrentMonth: false, dateStr: formatIsoDate(prevDate) });
    }
    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(calendarYear, calendarMonth, d);
      days.push({ day: d, isCurrentMonth: true, dateStr: formatIsoDate(curDate) });
    }
    // Next month padding to complete row
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(calendarYear, calendarMonth + 1, d);
      days.push({ day: d, isCurrentMonth: false, dateStr: formatIsoDate(nextDate) });
    }
    return days;
  }, [calendarYear, calendarMonth]);

  // Unique teams & groups
  const teams = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => set.add(e.team));
    return Array.from(set).sort();
  }, [employees]);

  const groups = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => set.add(e.comparisonGroup));
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees
      .filter(e => e.isActive)
      .filter(e => {
        if (selectedTeam !== 'ALL' && e.team !== selectedTeam) return false;
        if (selectedGroup !== 'ALL' && e.comparisonGroup !== selectedGroup) return false;
        if (searchTerm.trim().length > 0) {
          const q = searchTerm.toLowerCase();
          const fullName = `${e.lastName} ${e.firstName}`.toLowerCase();
          const mat = e.matricule.toLowerCase();
          return fullName.includes(q) || mat.includes(q);
        }
        return true;
      });
  }, [employees, selectedTeam, selectedGroup, searchTerm]);

  // Helper for day labels
  const formatDayHeader = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = isEn 
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dayNum = dateStr.split('-')[2];
    const isSunday = d.getDay() === 0;
    const isSaturday = d.getDay() === 6;
    return {
      name: dayNames[d.getDay()],
      num: dayNum,
      isWeekend: isSunday || isSaturday,
      isSunday
    };
  };

  const getTeamLabel = (team: string) => isEn && TEAMS_EN[team] ? TEAMS_EN[team] : team;
  const getGroupLabel = (group: string) => isEn && GROUPS_EN[group] ? GROUPS_EN[group] : group;
  const getShiftLabel = (code: string, fallback: string) => isEn && SHIFT_LABELS_EN[code] ? SHIFT_LABELS_EN[code] : fallback;
  const getPayPeriodLabel = (period: PayPeriod) => {
    if (!isEn) return period.label;
    const monthMap: Record<string, string> = {
      'Janvier': 'January', 'Février': 'February', 'Mars': 'March', 'Avril': 'April',
      'Mai': 'May', 'Juin': 'June', 'Juillet': 'July', 'Août': 'August',
      'Septembre': 'September', 'Octobre': 'October', 'Novembre': 'November', 'Décembre': 'December'
    };
    let lbl = period.label.replace('Période Paie', 'Payroll Period');
    for (const [fr, en] of Object.entries(monthMap)) {
      lbl = lbl.replace(fr, en);
    }
    return lbl;
  };

  return (
    <div className="space-y-4" onMouseUp={() => setIsPainting(false)} onMouseLeave={() => setIsPainting(false)}>
      {/* Control Bar: Quick Assign Brush */}
      {!isReadOnly && (
        <div className="bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[#E2E8F0]">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-xs font-bold text-[#1E293B]">
              {isEn ? 'Brush Mode:' : 'Mode Pinceau :'}
            </span>
          </div>
          
          <button
            onClick={() => setActiveBrush(null)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeBrush === null 
                ? 'bg-slate-800 text-white shadow-xs' 
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-slate-200'
            }`}
          >
            {isEn ? 'Disabled (Normal click)' : 'Désactivé (Clic normal)'}
          </button>
          
          <div className="h-4 w-px bg-[#E2E8F0] mx-1"></div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveBrush('OFF')}
              className={`px-3 py-1.5 text-[11px] font-bold tracking-tight rounded-md border transition-all ${
                activeBrush === 'OFF'
                  ? 'bg-slate-200 border-slate-400 text-slate-800 ring-2 ring-slate-400/30'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              OFF
            </button>
            {shifts.filter(s => s.code !== 'OFF').map(shift => (
              <button
                key={shift.code}
                onClick={() => setActiveBrush(shift.code)}
                className={`px-3 py-1.5 text-[11px] font-bold tracking-tight rounded-md border transition-all ${
                  activeBrush === shift.code
                    ? `${shift.colorBg || 'bg-slate-100'} ${shift.colorText || 'text-slate-800'} border-[#3B82F6] ring-2 ring-[#3B82F6]/30`
                    : `bg-white border-slate-200 text-slate-600 hover:bg-slate-50`
                }`}
                title={getShiftLabel(shift.code, shift.label)}
              >
                {shift.code}
              </button>
            ))}
          </div>
          <div className="ml-auto text-[10px] text-[#94A3B8] italic hidden sm:block">
            {isEn ? 'Tip: Hold click and drag across days to paint shifts.' : 'Astuce: Maintenez le clic et glissez pour peindre.'}
          </div>
        </div>
      )}

      {/* Control Bar: Filters, Views, Date Range Info & Calendar Selector */}
      <div 
        id="planning-control-bar"
        className="relative bg-white p-3.5 sm:p-4 rounded-2xl border border-[#CBD5E1] shadow-xs flex flex-wrap items-center justify-between gap-3.5 transition-all"
      >
        {/* Search & Selectors */}
        <div className="flex items-center flex-wrap gap-2.5 flex-1 min-w-[260px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              id="grid-search-employee"
              type="text"
              placeholder={isEn ? 'Search collaborator...' : 'Rechercher collaborateur...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-7 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-full w-44 sm:w-56 text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#1E293B]"
                title={isEn ? 'Clear' : 'Effacer'}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              id="grid-filter-team"
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6] cursor-pointer"
            >
              <option value="ALL">{t('employees.allTeams')}</option>
              {teams.map(t => (
                <option key={t} value={t}>{getTeamLabel(t)}</option>
              ))}
            </select>

            <select
              id="grid-filter-group"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6] cursor-pointer"
            >
              <option value="ALL">{isEn ? 'All groups' : 'Tous les groupes'}</option>
              {groups.map(g => (
                <option key={g} value={g}>{getGroupLabel(g)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Calendar Selector & Date Navigation */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0] shadow-2xs">
          {/* Previous Period */}
          <button
            id="grid-btn-prev-period"
            onClick={handlePrevPeriod}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition-colors"
            title={isEn ? 'Previous period' : 'Période précédente'}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Calendar Picker Trigger Button */}
          <button
            id="grid-btn-calendar-selector"
            onClick={() => setIsCalendarOpen(prev => !prev)}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ring-offset-1 focus:ring-2 focus:ring-[#3B82F6]/30 ${
              isCalendarOpen 
                ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#2563EB] shadow-xs' 
                : 'bg-white border-[#CBD5E1] text-[#1E293B] hover:border-[#3B82F6] hover:bg-[#F8FAFC]'
            }`}
            title={isEn ? 'Open calendar and period selector' : 'Ouvrir le calendrier et sélecteur de période'}
          >
            <Calendar className="w-4 h-4 text-[#3B82F6]" />
            <span className="font-bold tracking-tight">{activePeriodLabel}</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded font-semibold bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]">
              {displayedDates.length} {isEn ? 'd' : 'j'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform duration-200 ${isCalendarOpen ? 'rotate-180 text-[#3B82F6]' : 'group-hover:text-[#1E293B]'}`} />
          </button>

          {/* Next Period */}
          <button
            id="grid-btn-next-period"
            onClick={handleNextPeriod}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition-colors"
            title={isEn ? 'Next period' : 'Période suivante'}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Reset / Return to Default Version Period */}
          <div className="h-4 w-px bg-[#E2E8F0] mx-0.5" />
          <button
            id="grid-btn-reset-period"
            onClick={handleResetToVersionPeriod}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#3B82F6] hover:bg-white transition-colors"
            title={isEn ? 'Reset to active version period (Sept 2026)' : 'Réinitialiser à la période active (Sept 2026)'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: View Mode Switches */}
        <div className="inline-flex rounded-xl border border-[#E2E8F0] p-1 bg-[#F1F5F9] text-xs font-semibold">
          <button
            id="grid-view-two-months"
            onClick={() => setViewMode('TWO_MONTHS')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'TWO_MONTHS'
                ? 'bg-white text-[#3B82F6] shadow-xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {isEn ? '2 Months' : '2 Mois'}
          </button>
          <button
            id="grid-view-month"
            onClick={() => setViewMode('MONTH')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'MONTH'
                ? 'bg-white text-[#3B82F6] shadow-xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {isEn ? 'Month' : 'Mois'}
          </button>
          <button
            id="grid-view-fortnight"
            onClick={() => setViewMode('FORTNIGHT')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'FORTNIGHT'
                ? 'bg-white text-[#3B82F6] shadow-xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {isEn ? '14 Days' : '2 Sem.'}
          </button>
          <button
            id="grid-view-week"
            onClick={() => setViewMode('WEEK')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'WEEK'
                ? 'bg-white text-[#3B82F6] shadow-xs font-bold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {isEn ? 'Week' : 'Hebdo'}
          </button>
          {viewMode === 'CUSTOM' && (
            <button
              id="grid-view-custom"
              onClick={() => setViewMode('CUSTOM')}
              className="px-3 py-1 rounded-lg bg-white text-[#3B82F6] shadow-xs font-bold"
            >
              {isEn ? 'Custom' : 'Perso'}
            </button>
          )}
        </div>

        {/* Calendar Popover Modal */}
        {isCalendarOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-slate-900/15 backdrop-blur-[0.5px]" 
              onClick={() => setIsCalendarOpen(false)} 
            />
            <div 
              id="planning-calendar-popover"
              className="absolute top-full mt-2.5 left-0 sm:left-auto sm:right-10 md:left-64 lg:left-96 z-50 w-full max-w-[420px] bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl p-4 space-y-3.5 text-xs text-[#1E293B] animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Popover Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#3B82F6]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1E293B]">
                      {isEn ? 'Calendar & Period Selector' : 'Sélecteur de Calendrier & Période'}
                    </h3>
                    <p className="text-[10px] text-[#64748B]">
                      {isEn ? 'Navigate through months, weeks or custom ranges' : 'Naviguez entre mois, semaines ou plages personnalisées'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs in Popover */}
              <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setCalendarTab('MONTHS')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                    calendarTab === 'MONTHS'
                      ? 'bg-white text-[#3B82F6] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {isEn ? 'Month & Days' : 'Mois & Jours'}
                </button>
                <button
                  onClick={() => setCalendarTab('PRESETS')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                    calendarTab === 'PRESETS'
                      ? 'bg-white text-[#3B82F6] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {isEn ? 'Pay Periods' : 'Périodes de Paie'}
                </button>
                <button
                  onClick={() => setCalendarTab('CUSTOM')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                    calendarTab === 'CUSTOM'
                      ? 'bg-white text-[#3B82F6] shadow-2xs font-bold'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {isEn ? 'Custom Range' : 'Plage Libre'}
                </button>
              </div>

              {/* TAB 1: Month / Year / Mini Calendar */}
              {calendarTab === 'MONTHS' && (
                <div className="space-y-3">
                  {/* Year Switcher */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      onClick={() => setCalendarYear(y => y - 1)}
                      className="p-1 rounded-md text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]"
                      title={isEn ? 'Previous year' : 'Année précédente'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-extrabold text-[#1E293B]">{calendarYear}</span>
                    <button
                      onClick={() => setCalendarYear(y => y + 1)}
                      className="p-1 rounded-md text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9]"
                      title={isEn ? 'Next year' : 'Année suivante'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 12 Months Grid */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {(isEn ? MONTHS_SHORT_EN : MONTHS_SHORT_FR).map((mShort, idx) => {
                      const isCurrentSelected = currentDate.getFullYear() === calendarYear && currentDate.getMonth() === idx;
                      const isBrowsingMonth = calendarMonth === idx;
                      return (
                        <button
                          key={mShort}
                          onClick={() => {
                            setCalendarMonth(idx);
                            handleSelectMonth(idx);
                          }}
                          className={`py-1.5 text-[11px] rounded-lg font-bold border transition-all ${
                            isCurrentSelected
                              ? 'bg-[#3B82F6] text-white border-[#2563EB] shadow-xs'
                              : isBrowsingMonth
                              ? 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]'
                              : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-slate-100 hover:text-[#1E293B]'
                          }`}
                        >
                          {mShort}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mini Calendar for selected calendarMonth */}
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[11px] font-bold text-[#1E293B]">
                        {(isEn ? MONTHS_EN : MONTHS_FR)[calendarMonth]} {calendarYear}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {isEn ? 'Click any day to jump' : 'Cliquez sur un jour'}
                      </span>
                    </div>
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#94A3B8] mb-1">
                      {(isEn ? WEEKDAYS_SHORT_EN : WEEKDAYS_SHORT_FR).map(wd => (
                        <div key={wd}>{wd}</div>
                      ))}
                    </div>
                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {miniCalendarDays.map((item, i) => {
                        const isVisibleDate = displayedDates.includes(item.dateStr);
                        const isToday = item.dateStr === formatIsoDate(new Date());
                        return (
                          <button
                            key={i}
                            disabled={!item.isCurrentMonth}
                            onClick={() => handleSelectDay(item.day)}
                            className={`py-1 text-[11px] rounded-md font-medium transition-all ${
                              !item.isCurrentMonth
                                ? 'text-[#CBD5E1] cursor-default'
                                : isVisibleDate
                                ? 'bg-[#3B82F6] text-white font-bold shadow-2xs'
                                : isToday
                                ? 'border border-[#3B82F6] text-[#3B82F6] font-bold'
                                : 'text-[#1E293B] hover:bg-[#F1F5F9]'
                            }`}
                          >
                            {item.day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Official Pay Periods (R02 compliant) */}
              {calendarTab === 'PRESETS' && (
                <div className="space-y-2.5">
                  <div className="text-[11px] text-[#64748B] font-medium">
                    {isEn ? 'Standard Pay Periods (26th to 25th of month):' : 'Périodes de Paie Décalées (26 au 25 du mois suivant) :'}
                  </div>
                  <div className="space-y-1.5">
                    {effectivePayPeriods.map(period => {
                      const isActive = viewMode === 'CUSTOM' && customStartDate === period.startDate && customEndDate === period.endDate;
                      return (
                        <button
                          key={period.id}
                          onClick={() => {
                            setCustomStartDate(period.startDate);
                            setCustomEndDate(period.endDate);
                            setInputStart(period.startDate);
                            setInputEnd(period.endDate);
                            setViewMode('CUSTOM');
                            setIsCalendarOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-[#EFF6FF] border-[#3B82F6] ring-2 ring-[#3B82F6]/20'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white hover:border-[#CBD5E1]'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-[#1E293B] flex items-center gap-1.5">
                              <span>{getPayPeriodLabel(period)}</span>
                              {isActive && <Check className="w-3.5 h-3.5 text-[#3B82F6]" />}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              {period.startDate} {isEn ? 'to' : 'au'} {period.endDate}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                            period.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {period.status === 'OPEN' ? (isEn ? 'Open' : 'Ouverte') : (isEn ? 'Closed' : 'Clôturée')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Standard Calendar Presets */}
                  <div className="pt-2 border-t border-[#E2E8F0]">
                    <div className="text-[11px] text-[#64748B] font-medium mb-1.5">
                      {isEn ? 'Quick Standard Months:' : 'Mois Civils Rapides :'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => {
                          const d = new Date(2026, 7, 1);
                          setCurrentDate(d);
                          setCalendarMonth(7);
                          setViewMode('MONTH');
                          setIsCalendarOpen(false);
                        }}
                        className="py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-lg text-left text-[11px] font-semibold text-[#1E293B]"
                      >
                        {isEn ? 'August 2026' : 'Août 2026'}
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date(2026, 8, 1);
                          setCurrentDate(d);
                          setCalendarMonth(8);
                          setViewMode('MONTH');
                          setIsCalendarOpen(false);
                        }}
                        className="py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-lg text-left text-[11px] font-semibold text-[#1E293B]"
                      >
                        {isEn ? 'September 2026' : 'Septembre 2026'}
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date(2026, 9, 1);
                          setCurrentDate(d);
                          setCalendarMonth(9);
                          setViewMode('MONTH');
                          setIsCalendarOpen(false);
                        }}
                        className="py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-lg text-left text-[11px] font-semibold text-[#1E293B]"
                      >
                        {isEn ? 'October 2026' : 'Octobre 2026'}
                      </button>
                      <button
                        onClick={() => {
                          const d = new Date(2026, 10, 1);
                          setCurrentDate(d);
                          setCalendarMonth(10);
                          setViewMode('MONTH');
                          setIsCalendarOpen(false);
                        }}
                        className="py-1.5 px-2 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-lg text-left text-[11px] font-semibold text-[#1E293B]"
                      >
                        {isEn ? 'November 2026' : 'Novembre 2026'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Custom Date Range Form */}
              {calendarTab === 'CUSTOM' && (
                <div className="space-y-3">
                  <div className="text-[11px] text-[#64748B]">
                    {isEn ? 'Select any start and end date to display in the planning matrix:' : 'Sélectionnez une date de début et de fin pour afficher la matrice :'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748B] mb-1">
                        {isEn ? 'Start Date' : 'Date de début'}
                      </label>
                      <input
                        type="date"
                        value={inputStart}
                        onChange={e => setInputStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#64748B] mb-1">
                        {isEn ? 'End Date' : 'Date de fin'}
                      </label>
                      <input
                        type="date"
                        value={inputEnd}
                        onChange={e => setInputEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg text-xs font-semibold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleApplyCustomRange}
                      disabled={!inputStart || !inputEnd}
                      className="w-full py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isEn ? 'Apply Date Window' : 'Appliquer la plage'}
                    </button>
                  </div>
                </div>
              )}

              {/* Popover Footer */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                <button
                  onClick={handleResetToVersionPeriod}
                  className="text-[#3B82F6] hover:underline font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {isEn ? 'Reset to Sept 2026' : 'Période active (Sept 2026)'}
                </button>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-slate-200 text-[#475569] font-semibold"
                >
                  {isEn ? 'Close' : 'Fermer'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Interactive Matrix */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto max-h-[calc(100vh-250px)] min-h-[520px] relative w-full">
          <table className="w-full border-collapse text-left text-xs table-auto">
            {/* Table Header */}
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] sticky top-0 z-20">
              <tr>
                {/* Employee column pinned */}
                <th className="py-2.5 px-3 w-52 min-w-[190px] lg:w-60 lg:min-w-[210px] sticky left-0 bg-[#F8FAFC] z-30 border-r border-[#E2E8F0] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#1E293B] font-bold">
                      {isEn ? `Collaborator (${filteredEmployees.length})` : `Collaborateur (${filteredEmployees.length})`}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] font-normal uppercase">
                      {isEn ? 'Team' : 'Équipe'}
                    </span>
                  </div>
                </th>

                {/* Key counters column */}
                <th className="py-2.5 px-2 w-28 min-w-[105px] text-center bg-[#F1F5F9]/80 border-r border-[#E2E8F0]">
                  <div className="text-[10px] text-[#64748B] font-medium">{isEn ? 'Totals' : 'Cumuls'}</div>
                  <div className="text-[11px] text-[#1E293B] font-bold">{isEn ? 'Hours • S3 • Sun' : 'Heures • S3 • Dim'}</div>
                </th>

                {/* Date columns */}
                {displayedDates.map(dateStr => {
                  const h = formatDayHeader(dateStr);
                  const cov = dailyCoverage[dateStr];
                  const hasDeficit = cov && cov.deficits.length > 0;

                  return (
                    <th
                      key={dateStr}
                      className={`py-2 px-1 text-center min-w-[36px] sm:min-w-[40px] border-r border-[#F1F5F9] select-none ${
                        h.isSunday
                          ? 'bg-[#FEF2F2] text-[#EF4444]'
                          : h.isWeekend
                          ? 'bg-[#FFFBEB] text-[#D97706]'
                          : 'bg-[#F8FAFC] text-[#64748B]'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold tracking-tight">{h.name}</div>
                      <div className={`text-xs font-black ${h.isSunday ? 'text-[#EF4444]' : 'text-[#1E293B]'}`}>
                        {h.num}
                      </div>
                      {hasDeficit && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mx-auto mt-0.5" title={isEn ? 'Coverage deficit on this date' : 'Déficit de couverture sur cette date'} />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredEmployees.map(emp => {
                const stats = statsByEmployee[emp.id];
                return (
                  <tr key={emp.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    {/* Employee sticky cell - preserve raw agent name without translation */}
                    <td className="sticky left-0 bg-white z-10 p-2 border-r-2 border-[#E2E8F0] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#64748B]">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#1E293B] text-xs uppercase tracking-tight">{emp.lastName} {emp.firstName}</div>
                          <div className="text-[10px] text-[#94A3B8] font-medium flex items-center gap-1">
                            {emp.contractType} <span className="w-1 h-1 rounded-full bg-[#CBD5E1]"></span> {emp.weeklyHours}h
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stats cells */}
                    <td className="p-2 border-r border-[#E2E8F0] text-center bg-[#F8FAFC]/50">
                      <div className="flex items-center justify-center gap-1 font-mono text-[11px]">
                        <span className={`font-bold ${(stats?.totalCountedHours || 0) < emp.weeklyHours ? 'text-amber-500' : 'text-[#3B82F6]'}`}>
                          {stats?.totalCountedHours || 0}h
                        </span>
                        <span className="text-[#CBD5E1]">•</span>
                        <span className="text-[#3B82F6] font-semibold">{stats?.s3Count || 0}</span>
                        <span className="text-[#CBD5E1]">•</span>
                        <span className="text-[#EF4444] font-semibold">{stats?.sundaysCount || 0}</span>
                      </div>
                    </td>

                    {/* Days */}
                    {displayedDates.map(dateStr => {
                      const asgKey = `${emp.id}_${dateStr}`;
                      const asg = assignmentsMap.get(asgKey) || assignmentsMap.get(`${emp.id}-${dateStr}`);
                      const cellIssues = issuesMap.get(asgKey) || issuesMap.get(`${emp.id}-${dateStr}`) || [];
                      const hasHardIssue = (cellIssues || []).some?.(i => i.level === 'HARD') ?? false;
                      const hasWarning = (cellIssues || []).some?.(i => i.level === 'WARNING') ?? false;
                      const shift = asg ? shiftMap.get(asg.shiftCode) : undefined;
                      const isSunday = new Date(dateStr).getDay() === 0;

                      return (
                        <td
                          key={dateStr}
                          onMouseDown={() => {
                            if (!isReadOnly) {
                              setIsPainting(true);
                              if (activeBrush && onQuickAssign) {
                                onQuickAssign(emp.id, dateStr, activeBrush);
                              }
                            }
                          }}
                          onMouseEnter={() => {
                            if (!isReadOnly && isPainting && activeBrush && onQuickAssign) {
                              onQuickAssign(emp.id, dateStr, activeBrush);
                            }
                          }}
                          onClick={() => {
                            if (!isReadOnly && !activeBrush) {
                              onSelectCell(emp, dateStr, asg);
                            }
                          }}
                          className={`p-1 text-center border-r border-slate-100 transition-all ${
                            isSunday ? 'bg-rose-50/20' : ''
                          } ${
                            !isReadOnly ? 'cursor-pointer hover:bg-indigo-50/50' : 'cursor-default'
                          } ${activeBrush ? 'select-none' : ''}`}
                        >
                          {asg ? (
                            <div
                              id={`cell-${emp.id}-${dateStr}`}
                              className={`w-full min-h-[28px] flex items-center justify-center relative group px-1 py-1 rounded-md border text-[11px] font-bold tracking-tight transition-all shadow-2xs ${
                                shift?.colorBg || 'bg-slate-100'
                              } ${shift?.colorText || 'text-slate-800'} ${
                                hasHardIssue
                                  ? 'border-rose-500 ring-1 ring-rose-500 animate-pulse'
                                  : hasWarning
                                  ? 'border-amber-400 ring-1 ring-amber-400'
                                  : shift?.colorBorder || 'border-slate-300'
                              }`}
                              title={`${getShiftLabel(asg.shiftCode, shift?.label || asg.shiftCode)} (${asg.countedHours}h) - Source: ${asg.source}${
                                asg.isOverride ? `\n⚠️ ${isEn ? 'Override:' : 'Dérogation :'} ${asg.overrideReason}` : ''
                              }${cellIssues.length > 0 ? `\n${cellIssues.map(i => i.message).join('\n')}` : ''}`}
                            >
                              <span>{asg.shiftCode}</span>

                              {/* Small badge if override */}
                              {asg.isOverride && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[7px]" title={isEn ? 'Validated override' : 'Dérogation validée'}>
                                  ★
                                </span>
                              )}

                              {/* Conflict indicator icon */}
                              {hasHardIssue && (
                                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[7px]" title={isEn ? 'Blocking HARD violation' : 'Violation HARD bloquante'}>
                                  !
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-7 w-full rounded border border-dashed border-slate-200 hover:border-indigo-400 flex items-center justify-center text-[10px] text-slate-300 font-mono">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>

            {/* Daily Operational Coverage Footer */}
            <tfoot className="bg-[#F8FAFC] border-t-2 border-[#E2E8F0] sticky bottom-0 z-20">
              {['M1', 'M2', 'S1', 'S3'].map(subFamily => (
                <tr key={subFamily} className="text-[10px]">
                  <td className="py-1 px-3 sticky left-0 bg-[#F1F5F9] z-30 font-bold text-[#1E293B] border-r border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <span>{isEn ? `Required ${subFamily}` : `Besoin ${subFamily}`}</span>
                      <span className="text-[9px] text-[#94A3B8] font-normal">{isEn ? 'Min req.' : 'Min requis'}</span>
                    </div>
                  </td>
                  <td className="py-1 px-2 text-center bg-[#F1F5F9] font-mono text-[9px] text-[#64748B] border-r border-[#E2E8F0]">
                    {isEn ? 'Coverage' : 'Couverture'}
                  </td>

                  {displayedDates.map(dateStr => {
                    const cov = dailyCoverage[dateStr];
                    const count = cov?.familyCounts[subFamily] || 0;
                    const deficitItem = cov?.deficits.find(d => d.subFamily === subFamily);

                    return (
                      <td
                        key={dateStr}
                        className={`py-1 px-0.5 text-center font-mono font-bold border-r border-[#E2E8F0] ${
                          deficitItem
                            ? 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]'
                            : count > 0
                            ? 'text-[#1E293B]'
                            : 'text-[#CBD5E1]'
                        }`}
                        title={
                          deficitItem
                            ? `${isEn ? 'Deficit' : 'Déficit'} ${subFamily} : ${count}/${deficitItem.required}`
                            : `${subFamily} : ${count} ${isEn ? 'assigned' : 'assigné(s)'}`
                        }
                      >
                        <span className={deficitItem ? 'text-[#EF4444] underline font-black' : ''}>
                          {count}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tfoot>
          </table>
        </div>
      </div>

      {/* Legend and Ergonomic Guide */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs text-xs text-[#64748B] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-[#1E293B] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#3B82F6]" /> {isEn ? 'Shift Legend:' : 'Légende des Shifts :'}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-medium">
            M1 / M2 / M3 ({isEn ? 'Morning - 7.5h' : 'Matin - 7.5h'})
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-medium">
            S1 / S2 ({isEn ? 'Afternoon - 7.5h' : 'Après-midi - 7.5h'})
          </span>
          <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-900 border border-violet-300 font-medium">
            S3 ({isEn ? 'Late closure - 7.5h' : 'Fermeture tardive - 7.5h'})
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium">
            J ({isEn ? 'Day - 7.5h' : 'Journée - 7.5h'})
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1E293B] text-white font-medium">
            N ({isEn ? 'Night spanning midnight - 8.0h' : 'Nuit traversant minuit - 8.0h'})
          </span>
          <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300 font-medium">
            OFF ({isEn ? 'Rest' : 'Repos'})
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-medium">
            CP ({isEn ? 'Paid Leave - 7.0h' : 'Congés Payés - 7.0h'})
          </span>
        </div>

        <div className="text-[11px] text-[#64748B] flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block" /> {isEn ? 'HARD Violation' : 'Violation HARD'}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> {isEn ? 'WARNING Alert' : 'Alerte WARNING'}
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[#F59E0B] font-bold">★</span> {isEn ? 'Logged Override' : 'Dérogation Tracée'}
          </span>
        </div>
      </div>
    </div>
  );
};
