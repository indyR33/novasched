/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  AlertCircle,
  ShieldAlert,
  Info,
  Lock,
  Layers,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import {
  Employee,
  Shift,
  Assignment,
  PlanningVersion,
  UserRole,
  ValidationIssue
} from '../types/planning';
import { EmployeePeriodStats, DailyCoverageStatus } from '../engine/rulesEngine';

interface PlanningGridProps {
  version: PlanningVersion;
  employees: Employee[];
  shifts: Shift[];
  statsByEmployee: Record<string, EmployeePeriodStats>;
  dailyCoverage: Record<string, DailyCoverageStatus>;
  issues: ValidationIssue[];
  userRole: UserRole;
  onSelectCell: (employee: Employee, date: string, currentAssignment?: Assignment) => void;
  onQuickAssign?: (employeeId: string, date: string, shiftCode: string) => void;
}

export const PlanningGrid: React.FC<PlanningGridProps> = ({
  version,
  employees,
  shifts,
  statsByEmployee,
  dailyCoverage,
  issues,
  userRole,
  onSelectCell,
  onQuickAssign
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [activeBrush, setActiveBrush] = useState<string | null>(null);
  const [isPainting, setIsPainting] = useState<boolean>(false);

  const isReadOnly = userRole === 'VIEWER' || version.status === 'PUBLISHED' || version.status === 'ARCHIVED';

  // Build shift lookup map
  const shiftMap = useMemo(() => new Map<string, Shift>(shifts.map(s => [s.code, s])), [shifts]);

  // Build assignments map: `${employeeId}_${date}` -> Assignment
  const assignmentsMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    (version.assignments || []).forEach(a => {
      map.set(`${a.employeeId}_${a.date}`, a);
    });
    return map;
  }, [version.assignments]);

  // Build issue map: `${employeeId}_${date}` -> ValidationIssue[]
  const issuesMap = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    (issues || []).forEach(issue => {
      if (issue.employeeId && issue.date) {
        const key = `${issue.employeeId}_${issue.date}`;
        const list = map.get(key) || [];
        list.push(issue);
        map.set(key, list);
      }
    });
    return map;
  }, [issues]);

  // All dates in current version
  const allDates = useMemo(() => {
    const dates: string[] = [];
    const curr = new Date(version.startDate);
    const end = new Date(version.endDate);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [version.startDate, version.endDate]);

  // Slice dates if weekly view is selected
  const displayedDates = useMemo(() => {
    if (viewMode === 'MONTH') {
      return allDates;
    }
    const startIndex = Math.max(0, Math.min(weekOffset * 7, allDates.length - 7));
    return allDates.slice(startIndex, startIndex + 7);
  }, [viewMode, weekOffset, allDates]);

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
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
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

  return (
    <div className="space-y-4" onMouseUp={() => setIsPainting(false)} onMouseLeave={() => setIsPainting(false)}>
      {/* Control Bar: Quick Assign Brush (New Efficient Method) */}
      {!isReadOnly && (
        <div className="bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-[#E2E8F0]">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-xs font-bold text-[#1E293B]">{t('dashboard.kpi.brushMode') || 'Mode Pinceau :'}</span>
          </div>
          
          <button
            onClick={() => setActiveBrush(null)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeBrush === null 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-slate-200'
            }`}
          >
            {t('dashboard.kpi.brushOff') || 'Désactivé (Clic normal)'}
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
                title={shift.label}
              >
                {shift.code}
              </button>
            ))}
          </div>
          <div className="ml-auto text-[10px] text-[#94A3B8] italic hidden sm:block">
            {t('dashboard.kpi.brushTip') || 'Astuce: Maintenez le clic et glissez pour peindre.'}
          </div>
        </div>
      )}

      {/* Control Bar: Filters, Views, Date Range Info */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search & Selectors */}
        <div className="flex items-center flex-wrap gap-3 flex-1 min-w-[280px]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              id="grid-search-employee"
              type="text"
              placeholder="Rechercher collaborateur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-full w-48 sm:w-60 text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            <select
              id="grid-filter-team"
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">Toutes les équipes</option>
              {teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              id="grid-filter-group"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] font-medium focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ALL">Tous les groupes</option>
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View mode toggle & Week navigation */}
        <div className="flex items-center gap-2">
          {viewMode === 'WEEK' && (
            <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
              <button
                onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                disabled={weekOffset === 0}
                className="p-1 rounded text-[#64748B] hover:bg-white disabled:opacity-30"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-semibold text-[#1E293B] px-1.5">
                Semaine {weekOffset + 1}
              </span>
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                disabled={(weekOffset + 1) * 7 >= allDates.length}
                className="p-1 rounded text-[#64748B] hover:bg-white disabled:opacity-30"
                title="Semaine suivante"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F1F5F9] text-xs">
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'MONTH'
                  ? 'bg-white text-[#3B82F6] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Mois ({allDates.length} j)
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'WEEK'
                  ? 'bg-white text-[#3B82F6] shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              Hebdo (7 j)
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Matrix */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] relative">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Header */}
            <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0] sticky top-0 z-20">
              <tr>
                {/* Employee column pinned */}
                <th className="py-2.5 px-3 w-52 min-w-[200px] sticky left-0 bg-[#F8FAFC] z-30 border-r border-[#E2E8F0] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#1E293B] font-bold">Collaborateur ({filteredEmployees.length})</span>
                    <span className="text-[10px] text-[#94A3B8] font-normal uppercase">Équipe</span>
                  </div>
                </th>

                {/* Key counters column */}
                <th className="py-2.5 px-2 w-28 min-w-[110px] text-center bg-[#F1F5F9]/80 border-r border-[#E2E8F0]">
                  <div className="text-[10px] text-[#64748B] font-medium">Cumuls</div>
                  <div className="text-[11px] text-[#1E293B] font-bold">Heures • S3 • Dim</div>
                </th>

                {/* Date columns */}
                {displayedDates.map(dateStr => {
                  const h = formatDayHeader(dateStr);
                  const cov = dailyCoverage[dateStr];
                  const hasDeficit = cov && cov.deficits.length > 0;

                  return (
                    <th
                      key={dateStr}
                      className={`py-2 px-1 text-center min-w-[42px] border-r border-[#F1F5F9] select-none ${
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
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mx-auto mt-0.5" title="Déficit de couverture sur cette date" />
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
                    {/* Employee sticky cell */}
                                        {/* Employee sticky cell */}
                    <td className="sticky left-0 bg-white z-10 p-2 border-r-2 border-[#E2E8F0] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-bold text-xs text-[#64748B]">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-[#1E293B] text-xs uppercase tracking-tight">{emp.lastName}</div>
                          <div className="text-[10px] text-[#94A3B8] font-medium flex items-center gap-1">
                            {emp.contractType} <span className="w-1 h-1 rounded-full bg-[#CBD5E1]"></span> {emp.weeklyHours}h
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stats cells */}
                    <td className="p-2 border-r border-[#E2E8F0] text-center bg-[#F8FAFC]/50">
                      <span className={`text-xs font-bold ${(stats?.totalCountedHours || 0) < emp.weeklyHours ? 'text-amber-500' : 'text-[#3B82F6]'}`}>
                        {stats?.totalCountedHours || 0}h
                      </span>
                    </td>
                    <td className="p-2 border-r-2 border-[#E2E8F0] text-center bg-[#F8FAFC]/50">
                      <span className="text-[10px] font-bold text-[#64748B] bg-white px-1.5 py-0.5 rounded-md border border-[#E2E8F0]">
                        {stats?.weekendShifts || 0}
                      </span>
                    </td>

                    {/* Days */}
                    {displayedDates.map(dateStr => {
                      
                      const asgKey = `${emp.id}-${dateStr}`;
                      const asg = assignmentsMap.get(asgKey);
                      const cellIssues = issuesMap.get(asgKey) || [];
                      const hasHardIssue = cellIssues.some(i => i.level === 'HARD');
                      const hasWarning = cellIssues.some(i => i.level === 'WARNING');
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
                              className={`relative group px-1 py-1 rounded-md border text-[11px] font-bold tracking-tight transition-all shadow-2xs ${
                                shift?.colorBg || 'bg-slate-100'
                              } ${shift?.colorText || 'text-slate-800'} ${
                                hasHardIssue
                                  ? 'border-rose-500 ring-1 ring-rose-500 animate-pulse'
                                  : hasWarning
                                  ? 'border-amber-400 ring-1 ring-amber-400'
                                  : shift?.colorBorder || 'border-slate-300'
                              }`}
                              title={`${shift?.label || asg.shiftCode} (${asg.countedHours}h) - Source: ${asg.source}${
                                asg.isOverride ? `\n⚠️ Override: ${asg.overrideReason}` : ''
                              }${cellIssues.length > 0 ? `\n${cellIssues.map(i => i.message).join('\n')}` : ''}`}
                            >
                              <span>{asg.shiftCode}</span>

                              {/* Small badge if override */}
                              {asg.isOverride && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[7px]" title="Dérogation validée">
                                  ★
                                </span>
                              )}

                              {/* Conflict indicator icon */}
                              {hasHardIssue && (
                                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[7px]" title="Violation HARD bloquante">
                                  !
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="h-6 rounded border border-dashed border-slate-200 hover:border-indigo-400 flex items-center justify-center text-[10px] text-slate-300 font-mono">
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
              {/* Coverage summary row for M1, M2, S1, S3 */}
              {['M1', 'M2', 'S1', 'S3'].map(subFamily => (
                <tr key={subFamily} className="text-[10px]">
                  <td className="py-1 px-3 sticky left-0 bg-[#F1F5F9] z-30 font-bold text-[#1E293B] border-r border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <span>Besoin {subFamily}</span>
                      <span className="text-[9px] text-[#94A3B8] font-normal">Min requis</span>
                    </div>
                  </td>
                  <td className="py-1 px-2 text-center bg-[#F1F5F9] font-mono text-[9px] text-[#64748B] border-r border-[#E2E8F0]">
                    Couverture
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
                            ? `Déficit ${subFamily} : ${count}/${deficitItem.required}`
                            : `${subFamily} : ${count} assigné(s)`
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

      {/* Legend and Ergonomic Guide (Section 9 & R38) */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs text-xs text-[#64748B] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-semibold text-[#1E293B] flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#3B82F6]" /> Légende des Shifts :
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-medium">
            M1 / M2 / M3 (Matin - 7.5h)
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 font-medium">
            S1 / S2 (Après-midi - 7.5h)
          </span>
          <span className="px-2 py-0.5 rounded bg-violet-100 text-violet-900 border border-violet-300 font-medium">
            S3 (Fermeture tardive - 7.5h)
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium">
            J (Journée - 7.5h)
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1E293B] text-white font-medium">
            N (Nuit traversant minuit - 8.0h)
          </span>
          <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300 font-medium">
            OFF (Repos)
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-medium">
            CP (Congés Payés - 7.0h)
          </span>
        </div>

        <div className="text-[11px] text-[#64748B] flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#EF4444] inline-block" /> Violation HARD
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" /> Alerte WARNING
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[#F59E0B] font-bold">★</span> Dérogation Tracée
          </span>
        </div>
      </div>
    </div>
  );
};
