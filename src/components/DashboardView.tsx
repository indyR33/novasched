/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { PlanningVersion, ValidationIssue, Employee } from '../types/planning';
import { EmployeePeriodStats, DailyCoverageStatus } from '../engine/rulesEngine';

interface DashboardViewProps {
  version: PlanningVersion;
  employees: Employee[];
  statsByEmployee: Record<string, EmployeePeriodStats>;
  dailyCoverage: Record<string, DailyCoverageStatus>;
  issues: ValidationIssue[];
  totalHours: number;
  onOpenGenerator: () => void;
  onOpenValidation: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  version,
  employees,
  statsByEmployee,
  dailyCoverage,
  issues,
  totalHours,
  onOpenGenerator,
  onOpenValidation
}) => {
  const { t } = useTranslation();
  const hardIssues = useMemo(() => issues.filter(i => i.level === 'HARD'), [issues]);
  const warningIssues = useMemo(() => issues.filter(i => i.level === 'WARNING'), [issues]);
  const optIssues = useMemo(() => issues.filter(i => i.level === 'OPTIMISATION'), [issues]);

  const activeEmployees = useMemo(() => employees.filter(e => e.isActive), [employees]);
  const statsList = useMemo(() => Object.values(statsByEmployee || {}), [statsByEmployee]);

  // Coverage statistics
  const coverageStats = useMemo(() => {
    let totalSlotsNeeded = 0;
    let totalSlotsCovered = 0;
    let deficitCount = 0;

    (Object.values(dailyCoverage || {}) as DailyCoverageStatus[]).forEach(day => {
      // 4 subfamilies: M1, M2, S1, S3
      const m1Req = day.isWeekend ? 1 : 1;
      const m2Req = day.isWeekend ? 1 : 1;
      const s1Req = day.isWeekend ? 1 : 1;
      const s3Req = day.isWeekend ? 1 : 1;

      const needed = m1Req + m2Req + s1Req + s3Req;
      totalSlotsNeeded += needed;

      const m1Count = Math.min(m1Req, day.familyCounts['M1'] || 0);
      const m2Count = Math.min(m2Req, day.familyCounts['M2'] || 0);
      const s1Count = Math.min(s1Req, day.familyCounts['S1'] || 0);
      const s3Count = Math.min(s3Req, day.familyCounts['S3'] || 0);

      const covered = m1Count + m2Count + s1Count + s3Count;
      totalSlotsCovered += covered;
      if (covered < needed) {
        deficitCount += needed - covered;
      }
    });

    const rate = totalSlotsNeeded > 0 ? Math.round((totalSlotsCovered / totalSlotsNeeded) * 100) : 100;
    return { rate, totalSlotsNeeded, totalSlotsCovered, deficitCount };
  }, [dailyCoverage]);

  // Sorted by hours (most loaded / least loaded)
  const sortedByHours = useMemo(() => {
    return [...statsList].sort((a, b) => b.totalHours - a.totalHours);
  }, [statsList]);

  const avgHours = useMemo(() => {
    if (statsList.length === 0) return 0;
    return Math.round((totalHours / statsList.length) * 10) / 10;
  }, [statsList, totalHours]);

  // Group stats for fairness analysis (R31, R32)
  const groupedStats = useMemo(() => {
    const map = new Map<string, EmployeePeriodStats[]>();
    statsList.forEach(s => {
      const list = map.get(s.comparisonGroup) || [];
      list.push(s);
      map.set(s.comparisonGroup, list);
    });
    return Array.from(map.entries());
  }, [statsList]);

  // Weekday distribution calculation for the chart
  const weekDayAllocation = useMemo(() => {
    const days = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const s3Counts = [0, 0, 0, 0, 0, 0, 0];

    (Object.entries(dailyCoverage || {}) as [string, DailyCoverageStatus][]).forEach(([dateStr, status]) => {
      const d = new Date(dateStr);
      // getDay: 0 is Sun, 1 is Mon...
      const dayIdx = (d.getDay() + 6) % 7;
      const morningShifts = (status.familyCounts['M1'] || 0) + (status.familyCounts['M2'] || 0);
      const eveningShifts = (status.familyCounts['S1'] || 0) + (status.familyCounts['S3'] || 0);
      counts[dayIdx] += morningShifts;
      s3Counts[dayIdx] += eveningShifts;
    });

    const maxVal = Math.max(1, ...counts.map((c, i) => c + s3Counts[i]));

    return days.map((dayName, idx) => {
      const m = counts[idx];
      const s = s3Counts[idx];
      const total = m + s;
      const pctM = Math.min(100, Math.round((m / maxVal) * 100));
      const pctS = Math.min(100, Math.round((s / maxVal) * 100));
      return { dayName, m, s, total, pctM, pctS };
    });
  }, [dailyCoverage]);

  return (
    <div className="space-y-6">
      {/* Top Banner (Matching Professional Polish theme header) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight">{t('dashboard.title')}</h2>
          <p className="text-sm text-[#64748B]">
            {t('dashboard.subtitle')} • {activeEmployees.length} collaborateurs suivis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenValidation}
            className="flex items-center gap-1.5 bg-white text-[#1E293B] border border-[#E2E8F0] hover:bg-[#F8FAFC] px-3.5 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
            <span>{t('dashboard.kpi.audit')} ({issues.length})</span>
          </button>
          <button
            onClick={onOpenGenerator}
            className="flex items-center gap-2 bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs hover:bg-[#2563EB] transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>{t('dashboard.kpi.newPlanning')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (4 columns styled strictly according to Design HTML) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Score de Conformité */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">{t('dashboard.kpi.complianceScore')}</span>
            <div
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                version.validationScore >= 90
                  ? 'text-[#10B981] bg-[#ECFDF5]'
                  : version.validationScore >= 70
                  ? 'text-[#F59E0B] bg-[#FFFBEB]'
                  : 'text-[#EF4444] bg-[#FEF2F2]'
              }`}
            >
              {hardIssues.length === 0 ? t('dashboard.kpi.conforme') : `${hardIssues.length} ${t('dashboard.kpi.bloquants')}`}
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-[#1E293B]">{version.validationScore}%</div>
          <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all ${
                version.validationScore >= 90
                  ? 'bg-[#10B981]'
                  : version.validationScore >= 70
                  ? 'bg-[#F59E0B]'
                  : 'bg-[#EF4444]'
              }`}
              style={{ width: `${version.validationScore}%` }}
            ></div>
          </div>
        </div>

        {/* {t('dashboard.kpi.coverage')} */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">{t('dashboard.kpi.coverage')}</span>
            <div className="text-[#3B82F6] bg-[#EFF6FF] px-2 py-0.5 rounded text-xs font-bold">
              {coverageStats.deficitCount > 0 ? `${coverageStats.deficitCount} manques` : 'Optimal'}
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-[#1E293B]">{coverageStats.rate}%</div>
          <p className="text-xs text-[#94A3B8]">
            {coverageStats.totalSlotsCovered} / {coverageStats.totalSlotsNeeded} vacations assurées
          </p>
        </div>

        {/* Volume Heures */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Volume Heures</span>
            <div className="text-[#F59E0B] bg-[#FFFBEB] px-2 py-0.5 rounded text-xs font-bold">
              {avgHours}h / agent
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-[#1E293B]">{totalHours}h</div>
          <p className="text-xs text-[#94A3B8]">Moyenne d'activité sur la période</p>
        </div>

        {/* Anomalies & Dérogations */}
        <div
          onClick={onOpenValidation}
          className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs cursor-pointer hover:border-[#CBD5E1] transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Anomalies Détectées</span>
            <div
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                hardIssues.length > 0
                  ? 'text-[#EF4444] bg-[#FEF2F2]'
                  : warningIssues.length > 0
                  ? 'text-[#F59E0B] bg-[#FFFBEB]'
                  : 'text-[#10B981] bg-[#ECFDF5]'
              }`}
            >
              {hardIssues.length > 0 ? 'Action Requise' : 'Sous Contrôle'}
            </div>
          </div>
          <div className="text-3xl font-bold mb-1 text-[#1E293B]">
            {hardIssues.length} <span className="text-sm font-semibold text-[#EF4444]">HARD</span>
          </div>
          <p className="text-xs text-[#64748B] flex items-center justify-between">
            <span>{warningIssues.length} avertissements • {optIssues.length} optim.</span>
            <span className="text-[#3B82F6] font-semibold text-[11px]">Inspecter →</span>
          </p>
        </div>
      </div>

      {/* Two Column Layout (Matching Design HTML Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Upcoming Milestones / Points d'Attention */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="font-bold text-[#1E293B]">Points de Vigilance & Alertes Métier</h3>
            <button
              onClick={onOpenValidation}
              className="text-[#3B82F6] text-xs font-semibold hover:underline"
            >
              Tout Afficher
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4 flex-1">
            {/* Hard Violations (Urgent) */}
            {hardIssues.slice(0, 2).map((issue, idx) => (
              <div key={`hard-${idx}`} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1E293B] truncate">{issue.title}</div>
                  <div className="text-[10px] text-[#94A3B8] truncate">
                    {issue.ruleId} • {issue.date || 'Toutes dates'} {issue.employeeName ? `• ${issue.employeeName}` : ''}
                  </div>
                </div>
                <div className="text-xs font-bold text-[#EF4444] bg-[#FEF2F2] px-2 py-1 rounded">
                  BLOQUANT
                </div>
              </div>
            ))}

            {/* Warnings (Attention) */}
            {warningIssues.slice(0, 2).map((issue, idx) => (
              <div key={`warn-${idx}`} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#F59E0B] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-[#1E293B] truncate">{issue.title}</div>
                  <div className="text-[10px] text-[#94A3B8] truncate">
                    {issue.ruleId} • {issue.date || 'Période'} {issue.employeeName ? `• ${issue.employeeName}` : ''}
                  </div>
                </div>
                <div className="text-xs font-bold text-[#F59E0B] bg-[#FFFBEB] px-2 py-1 rounded">
                  ATTENTION
                </div>
              </div>
            ))}

            {/* Default state if no violations */}
            {hardIssues.length === 0 && warningIssues.length === 0 && (
              <div className="flex items-center gap-4 py-3">
                <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#10B981] shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#1E293B]">Planning 100% Conforme</div>
                  <div className="text-[10px] text-[#94A3B8]">Toutes les contraintes légales et contractuelles sont respectées.</div>
                </div>
                <div className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded">
                  CONFORME
                </div>
              </div>
            )}

            {/* Completed Milestone (Done) */}
            <div className="flex items-center gap-4 opacity-75 pt-2 border-t border-[#F1F5F9]">
              <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-[#1E293B]">Moteur de Validation Autonome</div>
                <div className="text-[10px] text-[#94A3B8]">40 règles métier surveillées en temps réel</div>
              </div>
              <div className="text-xs font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-1 rounded">
                ACTIF
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Resource Allocation (Bar Chart strictly matching Design HTML) */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col">
          <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="font-bold text-[#1E293B]">Répartition des Vacations par Jour</h3>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></div>
                <span className="text-[10px] font-semibold text-[#64748B]">Matin (M1/M2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></div>
                <span className="text-[10px] font-semibold text-[#64748B]">Soir/Nuit (S1/S3)</span>
              </div>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            {/* Bars Column (Design HTML representation) */}
            <div className="flex items-end justify-between h-36 gap-3 mb-2 px-2">
              {weekDayAllocation.map((item, idx) => (
                <div key={idx} className="w-full flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1E293B] text-white text-[10px] font-medium px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-20">
                    Matin: {item.m} | Soir: {item.s}
                  </div>
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Morning bar */}
                    <div className="w-1/2 bg-[#EFF6FF] rounded-t-md relative h-full flex items-end">
                      <div
                        className="w-full bg-[#3B82F6] rounded-t-md transition-all duration-300"
                        style={{ height: `${item.pctM}%` }}
                      ></div>
                    </div>
                    {/* Evening bar */}
                    <div className="w-1/2 bg-[#ECFDF5] rounded-t-md relative h-full flex items-end">
                      <div
                        className="w-full bg-[#10B981] rounded-t-md transition-all duration-300"
                        style={{ height: `${item.pctS}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Day Labels */}
            <div className="flex justify-between px-2 pt-2 border-t border-[#F1F5F9]">
              {weekDayAllocation.map((item, idx) => (
                <span key={idx} className="text-[10px] font-bold text-[#94A3B8] text-center w-full">
                  {item.dayName}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fairness & Balancing Matrix Section (R31, R32) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-4">
          <div>
            <h3 className="font-bold text-[#1E293B]">Équité de Charge & Pénibilité par Groupe (R31, R32)</h3>
            <p className="text-xs text-[#64748B]">Contrôle des écarts de vacations tardives (S3) et des dimanches travaillés</p>
          </div>
          <Award className="w-5 h-5 text-[#3B82F6]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedStats.map(([groupName, groupEmployees]) => {
            const s3s = groupEmployees.map(e => e.s3Count);
            const suns = groupEmployees.map(e => e.sundaysCount);
            const deltaS3 = Math.max(...s3s) - Math.min(...s3s);
            const deltaSun = Math.max(...suns) - Math.min(...suns);

            return (
              <div key={groupName} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#1E293B]">
                  <span>{groupName} ({groupEmployees.length} agents)</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${deltaS3 > 2 ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#ECFDF5] text-[#10B981]'}`}>
                      Écart S3 : {deltaS3}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${deltaSun > 1 ? 'bg-[#FFFBEB] text-[#F59E0B]' : 'bg-[#ECFDF5] text-[#10B981]'}`}>
                      Écart Dim : {deltaSun}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {groupEmployees.map(emp => (
                    <div key={emp.employeeId} className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1E293B] truncate">{emp.employeeName}</span>
                      <div className="flex items-center gap-2.5 font-mono text-[11px]">
                        <span className="text-[#3B82F6] font-semibold">{emp.s3Count} S3</span>
                        <span className="text-[#CBD5E1]">•</span>
                        <span className="text-[#EF4444] font-semibold">{emp.sundaysCount} Dim</span>
                        <span className="text-[#CBD5E1]">•</span>
                        <span className="text-[#64748B] font-bold">{emp.totalHours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
