/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, ShieldCheck, AlertTriangle, Check, ArrowRight, RotateCcw, Layers, Info, Link2, History } from 'lucide-react';
import {
  Employee,
  Shift,
  Qualification,
  CoverageRequirement,
  RotationPattern,
  Assignment,
  GenerationConfig
} from '../types/planning';
import { PlanningGenerator, GenerationResult } from '../engine/planningGenerator';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  employees: Employee[];
  shifts: Shift[];
  qualifications: Qualification[];
  coverageRequirements: CoverageRequirement[];
  rotationPatterns: RotationPattern[];
  existingAssignments: Assignment[];
  onApplyAssignments: (newAssignments: Assignment[]) => void;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  employees,
  shifts,
  qualifications,
  coverageRequirements,
  rotationPatterns,
  existingAssignments,
  onApplyAssignments
}) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [genStartDate, setGenStartDate] = useState(startDate);
  const [genEndDate, setGenEndDate] = useState(endDate);
  const [respectRotations, setRespectRotations] = useState(true);

  // Active rotation pattern selection
  const defaultPattern = rotationPatterns.find(p => p.isActive) || rotationPatterns[0];
  const [selectedRotationId, setSelectedRotationId] = useState<string>(defaultPattern?.id || '');
  const [staggerMode, setStaggerMode] = useState<'EMPLOYEE_STAGGERED' | 'TEAM_STAGGERED' | 'UNIFORM'>('EMPLOYEE_STAGGERED');

  const [consecutiveDaysLimit, setConsecutiveDaysLimit] = useState(6);
  const [s3Weight, setS3Weight] = useState(3);
  const [sundayWeight, setSundayWeight] = useState(2);
  const [hoursWeight, setHoursWeight] = useState(1);

  // Existing schedule integration controls
  const [preserveExisting, setPreserveExisting] = useState(true);
  const [linkPriorHistory, setLinkPriorHistory] = useState(true);

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  if (!isOpen) return null;

  const currentPattern = rotationPatterns.find(p => p.id === selectedRotationId) || defaultPattern;

  const handleRun = () => {
    setIsRunning(true);
    setResult(null);

    // Micro-delay for visual responsiveness
    setTimeout(() => {
      const config: GenerationConfig = {
        startDate: genStartDate,
        endDate: genEndDate,
        respectRotations,
        selectedRotationPatternId: selectedRotationId,
        rotationStaggerMode: staggerMode,
        balanceS3: true,
        balanceSundays: true,
        balanceHours: true,
        allowConsecutiveDaysLimit: consecutiveDaysLimit,
        targetWeeklyWorkDays: 4.5,
        targetWeeklyRestDays: 2.5,
        s3Weight,
        sundayWeight,
        hoursWeight,
        preserveExistingAssignments: preserveExisting,
        linkToPriorHistory: linkPriorHistory
      };

      const genResult = PlanningGenerator.generate(
        config,
        employees,
        shifts,
        qualifications,
        coverageRequirements,
        rotationPatterns,
        existingAssignments
      );

      setResult(genResult);
      setIsRunning(false);
    }, 200);
  };

  const handleApply = () => {
    if (result && result.assignments.length > 0) {
      onApplyAssignments(result.assignments);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E293B]">
                {isEn ? 'Automatic Schedule Generator' : 'Générateur Automatique de Planning'}
              </h3>
              <p className="text-xs text-[#64748B]">
                {isEn ? 'Rotation grid priority engine with strict regulatory constraint enforcement' : 'Moteur déterministe avec application prioritaire de la grille de rotation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Date range selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isEn ? 'Start Date' : 'Date de début'}
              </label>
              <input
                type="date"
                value={genStartDate}
                onChange={e => setGenStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isEn ? 'End Date' : 'Date de fin'}
              </label>
              <input
                type="date"
                value={genEndDate}
                onChange={e => setGenEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* EXISTING PLANNING INTEGRATION & INTELLIGENT LINKING */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                <Link2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">
                  {isEn ? 'Integration with Existing Schedule' : 'Intégration au planning existant (Enchaînement intelligent)'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isEn ? 'Link seamlessly without overwriting existing assignments or violating rules' : 'S\'articule harmonieusement sans écraser les données existantes'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200/80">
              {/* Toggle: Preserve existing assignments */}
              <label className="flex items-start justify-between gap-3 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-200 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    {isEn ? 'Preserve existing assignments & complete gaps' : 'Préserver l\'existant et compléter intelligemment'}
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {isEn ? 'Recommended' : 'Recommandé'}
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {isEn
                      ? 'Keeps all existing shifts, leaves, and overrides already planned. Only generates missing slots according to coverage rules.'
                      : 'Conserve tous les postes, congés et dérogations déjà planifiés sur la période. Ne génère que les créneaux vacants pour atteindre la couverture.'}
                  </p>
                </div>
                <div className="relative inline-flex items-center shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={preserveExisting}
                    onChange={e => setPreserveExisting(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
              </label>

              {/* Toggle: Link to prior history */}
              <label className="flex items-start justify-between gap-3 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-200 transition-colors">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-indigo-600" />
                    {isEn ? 'Enforce continuous legal rest & consecutive days linking' : 'Liaison continue avec l\'historique amont (R23 / R27)'}
                  </span>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {isEn
                      ? 'Checks shifts before the start date to enforce 11h rest after S3 and prevent exceeding 6 consecutive work days across periods.'
                      : 'Analyse les postes précédant la date de début pour garantir les 11h de repos après un S3 la veille et ne pas dépasser 6 jours de travail consécutifs.'}
                  </p>
                </div>
                <div className="relative inline-flex items-center shrink-0 pt-0.5">
                  <input
                    type="checkbox"
                    checked={linkPriorHistory}
                    onChange={e => setLinkPriorHistory(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
              </label>
            </div>
          </div>

          {/* ROTATION PATTERN PRIORITY CONFIGURATION */}
          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1E293B] text-xs">
                    {isEn ? 'Rotation Grid from "Coverage"' : 'Grille de rotation issue de « Couverture »'}
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    {isEn ? 'Apply cyclic rotation sequence in priority' : 'Déroulement du cycle de travail/repos en priorité 1'}
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={respectRotations}
                  onChange={e => setRespectRotations(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-xs font-semibold text-slate-700">
                  {respectRotations ? (isEn ? 'Active' : 'Prioritaire') : (isEn ? 'Inactive' : 'Désactivée')}
                </span>
              </label>
            </div>

            {respectRotations && (
              <div className="space-y-2.5 pt-2 border-t border-blue-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {isEn ? 'Selected rotation pattern:' : 'Modèle de rotation appliqué :'}
                    </label>
                    <select
                      value={selectedRotationId}
                      onChange={e => setSelectedRotationId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                    >
                      {rotationPatterns.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.cycleLength}j) {p.isActive ? (isEn ? '• Active' : '• Actif') : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {isEn ? 'Phase staggering mode:' : 'Mode de décalage de roulement :'}
                    </label>
                    <select
                      value={staggerMode}
                      onChange={e => setStaggerMode(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="EMPLOYEE_STAGGERED">
                        {isEn ? 'Continuous stagger per agent (recommended)' : 'Échelonné par agent (recommandé, couverture lissée)'}
                      </option>
                      <option value="TEAM_STAGGERED">
                        {isEn ? 'Staggered by team (Team A, Team B)' : 'Échelonné par équipe (Équipe A, Équipe B...)'}
                      </option>
                      <option value="UNIFORM">
                        {isEn ? 'Uniform (all start at Day 1)' : 'Uniforme (tous au même jour)'}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Steps visual preview */}
                {currentPattern && currentPattern.steps && (
                  <div className="bg-white/80 p-2.5 rounded-lg border border-blue-200/70">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1.5">
                      <span>{isEn ? 'Sequence cycle preview:' : 'Séquence du cycle sélectionné :'}</span>
                      <span className="font-mono text-blue-700 font-bold">
                        {currentPattern.cycleLength} {isEn ? 'days' : 'jours'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {currentPattern.steps.map((s, idx) => (
                        <div
                          key={idx}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border text-center ${
                            s.isRest || s.suggestedShiftCode === 'OFF'
                              ? 'bg-slate-100 border-slate-300 text-slate-600'
                              : s.suggestedShiftCode === 'S3'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <span className="text-[9px] opacity-70 mr-0.5">J{idx + 1}:</span>
                          <span>{s.isRest ? 'OFF' : (s.suggestedShiftCode || s.requiredFamily)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hard Constraints Guarantee */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{isEn ? 'Inviolability Guarantee of HARD Constraints' : "Garantie d'inviolabilité des contraintes HARD"}</span>
            </div>
            <p className="text-[11px] text-slate-600">
              {isEn ? (
                <>
                  The engine will assign <strong>no unqualified agent (R01)</strong>, strictly respect arrival/departure dates (R02, R03), preserve 11h of rest after an S3 shift (R27), and forbid more than {consecutiveDaysLimit} consecutive work days (R23).
                </>
              ) : (
                <>
                  Le moteur n'affectera <strong>aucun agent non habilité (R01)</strong>, respectera les dates d'arrivée/départ (R02, R03), préservera les 11h de repos après un S3 (R27), et interdira plus de {consecutiveDaysLimit} jours consécutifs (R23).
                </>
              )}
            </p>
          </div>

          {/* Optimization Weights Sliders (Section 14 & 23) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
              {isEn ? 'Optimization Objectives Weighting (Coverage Complement)' : "Pondération des Objectifs d'Équilibrage"}
            </span>

            {/* S3 weight */}
            <div>
              <div className="flex justify-between items-center text-slate-700 mb-1">
                <span>{isEn ? 'Balancing late closing shifts S3 (R31):' : 'Équilibrage des fermetures S3 (R31) :'}</span>
                <span className="font-bold text-indigo-700">{isEn ? 'Weight' : 'Poids'} {s3Weight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={s3Weight}
                onChange={e => setS3Weight(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Sundays weight */}
            <div>
              <div className="flex justify-between items-center text-slate-700 mb-1">
                <span>{isEn ? 'Balancing worked Sundays (R32):' : 'Équilibrage des dimanches travaillés (R32) :'}</span>
                <span className="font-bold text-indigo-700">{isEn ? 'Weight' : 'Poids'} {sundayWeight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={sundayWeight}
                onChange={e => setSundayWeight(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Total hours weight */}
            <div>
              <div className="flex justify-between items-center text-slate-700 mb-1">
                <span>{isEn ? 'Global hours volume smoothing (R17):' : 'Lissage du volume horaire global (R17) :'}</span>
                <span className="font-bold text-indigo-700">{isEn ? 'Weight' : 'Poids'} {hoursWeight}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={hoursWeight}
                onChange={e => setHoursWeight(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* Result / Diagnostic Panel */}
          {result && (
            <div className="pt-3 border-t border-slate-200">
              {result.success ? (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{isEn ? 'Feasible schedule successfully generated!' : 'Planning conforme généré avec succès !'}</span>
                    </div>

                    {result.summary.rotationAdherencePercentage !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                        {result.summary.rotationAdherencePercentage}% {isEn ? 'rotation adherence' : 'adhérence grille'}
                      </span>
                    )}
                  </div>

                  {result.summary.appliedRotationPatternName && (
                    <div className="text-[11px] text-emerald-900 bg-white/70 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span>
                        <strong>{isEn ? 'Pattern:' : 'Grille appliquée :'}</strong> {result.summary.appliedRotationPatternName}
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        {result.summary.rotationAppliedCount} {isEn ? 'direct cycle matches' : 'affectations directes cycle'} • {result.summary.rotationAdjustmentsCount || 0} {isEn ? 'legal adjustments' : 'ajustements de sécurité'}
                      </span>
                    </div>
                  )}

                  {result.summary.preservedExistingCount !== undefined && result.summary.preservedExistingCount > 0 && (
                    <div className="text-[11px] text-indigo-900 bg-indigo-50/90 p-2 rounded-lg border border-indigo-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Link2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        {isEn ? 'Existing shifts seamlessly preserved & linked:' : 'Affectations existantes préservées & liées :'}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
                        {result.summary.preservedExistingCount} {isEn ? 'shifts intact' : 'postes conservés'}
                      </span>
                    </div>
                  )}

                  {result.summary.priorHistoryLinked && (
                    <div className="text-[10px] text-slate-600 bg-white/80 px-2 py-1 rounded border border-slate-200 flex items-center gap-1.5">
                      <History className="w-3 h-3 text-indigo-500" />
                      <span>{isEn ? 'Continuous transition with prior period active (11h rest & max 6 consecutive days respected)' : 'Liaison historique amont active (repos 11h et max 6j consécutifs garantis)'}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-800 font-mono">
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">{isEn ? 'Assignments' : 'Affectations'}</div>
                      <div className="font-bold">{result.summary.totalAssignments}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">{isEn ? 'Working days' : 'Jours travaillés'}</div>
                      <div className="font-bold">{result.summary.workDaysCount}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">{isEn ? 'S3 Shifts' : 'Shifts S3'}</div>
                      <div className="font-bold">{result.summary.s3Count}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">{isEn ? 'Sundays' : 'Dimanches'}</div>
                      <div className="font-bold">{result.summary.sundayCount}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Impossibility Diagnostic (Section 26) */
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{isEn ? 'Mathematical Infeasibility Detected (Section 26)' : 'Impossibilité Mathématique Détectée (Section 26)'}</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    {isEn
                      ? 'No schedule can satisfy all HARD constraints without violation.'
                      : "Aucun planning ne peut satisfaire l'intégralité des contraintes HARD sans violation."}
                  </p>

                  <div className="space-y-1.5">
                    {result.diagnostic.reasons.map((r, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-rose-200 text-[11px] text-rose-950">
                        <strong>{r.date} ({r.family}) :</strong> {r.explanation}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-rose-200">
                    <span className="font-bold text-[11px] text-rose-900 block mb-1">
                      {isEn ? 'Suggested action steps:' : "Pistes d'actions suggérées :"}
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-0.5">
                      {result.diagnostic.suggestedActions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
          >
            {isEn ? 'Close' : 'Fermer'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-[#3B82F6] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors"
            >
              {isRunning
                ? (isEn ? 'Calculating...' : 'Calcul en cours...')
                : (isEn ? 'Calculate Schedule' : 'Calculer le planning')}
            </button>

            {result && result.success && (
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>{isEn ? 'Apply to Schedule' : 'Appliquer au Planning'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
