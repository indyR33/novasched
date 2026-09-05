/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CoverageRequirement, RotationPattern, UserRole } from '../types/planning';
import { ROTATION_PATTERNS_EN } from '../utils/i18nData';

interface CoverageManagerProps {
  coverageRequirements: CoverageRequirement[];
  rotationPatterns: RotationPattern[];
  userRole: UserRole;
  onUpdateCoverage: (reqs: CoverageRequirement[]) => void;
  onUpdateRotations: (patterns: RotationPattern[]) => void;
}

export const CoverageManager: React.FC<CoverageManagerProps> = ({
  coverageRequirements,
  rotationPatterns,
  userRole,
  onUpdateCoverage,
  onUpdateRotations
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [activeSubTab, setActiveSubTab] = useState<'COVERAGE' | 'ROTATION'>('COVERAGE');

  const handleMinChange = (id: string, newMin: number) => {
    if (userRole !== 'ADMIN') return;
    const updated = coverageRequirements.map(req => {
      if (req.id === id) {
        return { ...req, minimum: Math.max(0, newMin) };
      }
      return req;
    });
    onUpdateCoverage(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">{t('coverage.title')}</h2>
            <p className="text-xs text-[#64748B]">
              {t('coverage.subtitle')}
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-[#E2E8F0] p-1 bg-[#F8FAFC] text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('COVERAGE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'COVERAGE' ? 'bg-[#3B82F6] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {t('coverage.tabCoverage')}
          </button>
          <button
            onClick={() => setActiveSubTab('ROTATION')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'ROTATION' ? 'bg-[#3B82F6] text-white shadow-2xs' : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {t('coverage.tabRotation')} ({rotationPatterns.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'COVERAGE' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weekdays */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  {t('coverage.weekdaysTitle')}
                </h3>
                <p className="text-[11px] text-[#64748B]">{t('coverage.weekdaysSubtitle')}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#3B82F6] font-bold">
                DEFAULT_WEEKDAY
              </span>
            </div>

            <div className="space-y-2.5">
              {coverageRequirements
                .filter(r => r.date === 'DEFAULT_WEEKDAY')
                .map(req => (
                  <div
                    key={req.id}
                    className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#1E293B] text-sm mr-2">{req.subFamily}</span>
                      <span className="text-[#64748B] text-[11px]">{t('coverage.priority')} {req.priority}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[#64748B] font-medium">{t('coverage.minimum')}</span>
                      {userRole === 'ADMIN' ? (
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={req.minimum}
                          onChange={e => handleMinChange(req.id, Number(e.target.value))}
                          className="w-14 p-1 text-center font-bold bg-white border border-[#CBD5E1] rounded text-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                        />
                      ) : (
                        <span className="w-8 text-center font-bold text-[#3B82F6]">{req.minimum}</span>
                      )}
                      <span className="text-[#94A3B8]">{t('coverage.agentsCount')}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Weekends */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                  {t('coverage.weekendsTitle')}
                </h3>
                <p className="text-[11px] text-[#64748B]">{t('coverage.weekendsSubtitle')}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEF2F2] text-[#EF4444] font-bold">
                DEFAULT_WEEKEND
              </span>
            </div>

            <div className="space-y-2.5">
              {coverageRequirements
                .filter(r => r.date === 'DEFAULT_WEEKEND')
                .map(req => (
                  <div
                    key={req.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-sm mr-2">{req.subFamily}</span>
                      <span className="text-slate-500 text-[11px]">{t('coverage.priority')} {req.priority}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">{t('coverage.minimum')}</span>
                      {userRole === 'ADMIN' ? (
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={req.minimum}
                          onChange={e => handleMinChange(req.id, Number(e.target.value))}
                          className="w-14 p-1 text-center font-bold bg-white border border-slate-300 rounded text-rose-700"
                        />
                      ) : (
                        <span className="w-8 text-center font-bold text-rose-700">{req.minimum}</span>
                      )}
                      <span className="text-slate-400">{t('coverage.agentsCount')}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* Rotation Patterns */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rotationPatterns.map(pattern => {
              const pName = isEn && ROTATION_PATTERNS_EN[pattern.id] ? ROTATION_PATTERNS_EN[pattern.id].name : pattern.name;
              const pDesc = isEn && ROTATION_PATTERNS_EN[pattern.id] ? ROTATION_PATTERNS_EN[pattern.id].description : pattern.description;

              return (
                <div key={pattern.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{pName}</h3>
                      <p className="text-xs text-slate-500">{pDesc}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      {t('coverage.cycleDays', { count: pattern.cycleLength })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {pattern.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border text-center min-w-[50px] ${
                          step.isRest
                            ? 'bg-stone-100 border-stone-300 text-stone-700'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                        }`}
                      >
                        <div className="text-[9px] text-slate-400">{t('coverage.dayStep', { day: step.dayIndex + 1 })}</div>
                        <div className="text-xs font-bold">{step.suggestedShiftCode || step.requiredFamily}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
