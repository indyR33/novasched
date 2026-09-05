/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Info, CheckCircle2, Search, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ValidationIssue, RuleLevel } from '../types/planning';

interface ValidationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  issues: ValidationIssue[];
  score: number;
  onFocusCell?: (employeeId: string, date: string) => void;
}

export const ValidationDrawer: React.FC<ValidationDrawerProps> = ({
  isOpen,
  onClose,
  issues,
  score,
  onFocusCell
}) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [filterLevel, setFilterLevel] = useState<RuleLevel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const hardIssues = issues.filter(i => i.level === 'HARD');
  const warningIssues = issues.filter(i => i.level === 'WARNING');
  const optIssues = issues.filter(i => i.level === 'OPTIMISATION');

  const filteredIssues = issues
    .filter(i => filterLevel === 'ALL' || i.level === filterLevel)
    .filter(i => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q) ||
        i.ruleId.toLowerCase().includes(q) ||
        (i.date && i.date.includes(q))
      );
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-[#E2E8F0]">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#1E293B]">
                {isEn ? 'Compliance Audit' : 'Audit de Conformité'}
              </h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                score >= 90 ? 'bg-[#ECFDF5] text-[#10B981]' : score >= 75 ? 'bg-[#FFFBEB] text-[#F59E0B]' : 'bg-[#FEF2F2] text-[#EF4444]'
              }`}>
                {score}%
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              {hardIssues.length} {isEn ? 'blocking' : 'bloquants'} • {warningIssues.length} {isEn ? 'warnings' : 'alertes'} • {optIssues.length} {isEn ? 'optimizations' : 'optimisations'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="p-3 border-b border-[#E2E8F0] bg-white space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder={isEn ? 'Filter anomalies by rule, date...' : 'Filtrer anomalies par règle, date...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-full text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          <div className="flex gap-1 text-[11px] overflow-x-auto pb-1">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterLevel === 'ALL' ? 'bg-[#1E293B] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
              }`}
            >
              {isEn ? 'All' : 'Tous'} ({issues.length})
            </button>
            <button
              onClick={() => setFilterLevel('HARD')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterLevel === 'HARD' ? 'bg-[#EF4444] text-white' : 'bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2]'
              }`}
            >
              HARD ({hardIssues.length})
            </button>
            <button
              onClick={() => setFilterLevel('WARNING')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterLevel === 'WARNING' ? 'bg-[#F59E0B] text-white' : 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]'
              }`}
            >
              Warnings ({warningIssues.length})
            </button>
            <button
              onClick={() => setFilterLevel('OPTIMISATION')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterLevel === 'OPTIMISATION' ? 'bg-[#3B82F6] text-white' : 'bg-[#EFF6FF] text-[#3B82F6] hover:bg-[#DBEAFE]'
              }`}
            >
              {isEn ? 'Optimization' : 'Optimisation'} ({optIssues.length})
            </button>
          </div>
        </div>

        {/* Issue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-12 text-[#94A3B8]">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#10B981] mb-2 opacity-80" />
              <p className="text-xs font-semibold text-[#1E293B]">
                {isEn ? 'No anomalies in this category' : 'Aucune anomalie dans cette catégorie'}
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {isEn ? 'All verified rules are fully compliant.' : 'Toutes les règles vérifiées sont conformes.'}
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => {
              const isHard = issue.level === 'HARD';
              const isWarning = issue.level === 'WARNING';

              return (
                <div
                  key={issue.id}
                  className={`p-3.5 rounded-2xl border text-xs transition-all shadow-2xs ${
                    isHard
                      ? 'bg-[#FEF2F2]/60 border-[#FECACA]'
                      : isWarning
                      ? 'bg-[#FFFBEB]/60 border-[#FDE68A]'
                      : 'bg-[#EFF6FF]/40 border-[#BFDBFE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isHard ? (
                        <ShieldAlert className="w-4 h-4 text-[#EF4444] shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />
                      )}
                      <span className={isHard ? 'text-[#991B1B]' : isWarning ? 'text-[#92400E]' : 'text-[#1E40AF]'}>
                        {issue.title}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-[#E2E8F0] text-[#64748B] font-bold shrink-0">
                      {issue.ruleId}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[#334155] leading-relaxed">{issue.message}</p>

                  <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]/60 flex items-center justify-between text-[11px] text-[#64748B] font-mono">
                    <span>
                      {issue.date && `Date: ${issue.date}`}
                    </span>

                    {issue.employeeId && issue.date && onFocusCell && (
                      <button
                        onClick={() => {
                          onFocusCell(issue.employeeId!, issue.date!);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-[#3B82F6] hover:text-[#2563EB] font-sans font-semibold text-[11px]"
                      >
                        <span>{isEn ? 'Locate cell' : 'Localiser cellule'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
