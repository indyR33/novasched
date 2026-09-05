/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Zap, ShieldCheck, AlertTriangle, HelpCircle, Check, ArrowRight } from 'lucide-react';
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
  const [genStartDate, setGenStartDate] = useState(startDate);
  const [genEndDate, setGenEndDate] = useState(endDate);
  const [respectRotations, setRespectRotations] = useState(true);
  const [consecutiveDaysLimit, setConsecutiveDaysLimit] = useState(6);
  const [s3Weight, setS3Weight] = useState(3);
  const [sundayWeight, setSundayWeight] = useState(2);
  const [hoursWeight, setHoursWeight] = useState(1);

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  if (!isOpen) return null;

  const handleRun = () => {
    setIsRunning(true);
    setResult(null);

    // Simulate micro-turn for visual responsiveness
    setTimeout(() => {
      const config: GenerationConfig = {
        startDate: genStartDate,
        endDate: genEndDate,
        respectRotations,
        balanceS3: true,
        balanceSundays: true,
        balanceHours: true,
        allowConsecutiveDaysLimit: consecutiveDaysLimit,
        targetWeeklyWorkDays: 4.5,
        targetWeeklyRestDays: 2.5,
        s3Weight,
        sundayWeight,
        hoursWeight
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
              <h3 className="text-base font-bold text-[#1E293B]">Générateur Automatique de Planning</h3>
              <p className="text-xs text-[#64748B]">Moteur de contraintes déterministe avec équilibrage</p>
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
              <label className="block font-semibold text-slate-700 mb-1">Date de début</label>
              <input
                type="date"
                value={genStartDate}
                onChange={e => setGenStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={genEndDate}
                onChange={e => setGenEndDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Hard Constraints Guarantee */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Garantie d'inviolabilité des contraintes HARD</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Le moteur n'affectera <strong>aucun agent non habilité (R01)</strong>, respectera les dates d'arrivée/départ (R02, R03),
              préservera les 11h de repos après un S3 (R27), et interdira plus de {consecutiveDaysLimit} jours consécutifs (R23).
            </p>
          </div>

          {/* Optimization Weights Sliders (Section 14 & 23) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px]">
              Pondération des Objectifs d'Optimisation
            </span>

            {/* S3 weight */}
            <div>
              <div className="flex justify-between items-center text-slate-700 mb-1">
                <span>Équilibrage des fermetures S3 (R31) :</span>
                <span className="font-bold text-indigo-700">Poids {s3Weight}</span>
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
                <span>Équilibrage des dimanches travaillés (R32) :</span>
                <span className="font-bold text-indigo-700">Poids {sundayWeight}</span>
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
                <span>Lissage du volume horaire global (R17) :</span>
                <span className="font-bold text-indigo-700">Poids {hoursWeight}</span>
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
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Planning réalisable généré avec succès !</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-emerald-800 font-mono">
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">Affectations</div>
                      <div className="font-bold">{result.summary.totalAssignments}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">Jours travaillés</div>
                      <div className="font-bold">{result.summary.workDaysCount}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">Shifts S3</div>
                      <div className="font-bold">{result.summary.s3Count}</div>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded border border-emerald-200 text-center">
                      <div className="text-[10px] text-slate-500">Dimanches</div>
                      <div className="font-bold">{result.summary.sundayCount}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Impossibility Diagnostic (Section 26) */
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-300 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Impossibilité Mathématique Détectée (Section 26)</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Aucun planning ne peut satisfaire l'intégralité des contraintes HARD sans violation.
                  </p>

                  <div className="space-y-1.5">
                    {result.diagnostic.reasons.map((r, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-rose-200 text-[11px] text-rose-950">
                        <strong>{r.date} ({r.family}) :</strong> {r.explanation}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-rose-200">
                    <span className="font-bold text-[11px] text-rose-900 block mb-1">Pistes d'actions suggérées :</span>
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
            Fermer
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-[#3B82F6] bg-[#EFF6FF] hover:bg-[#DBEAFE] border border-[#BFDBFE] transition-colors"
            >
              {isRunning ? 'Calcul en cours...' : 'Calculer le planning'}
            </button>

            {result && result.success && (
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Appliquer au Planning</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
