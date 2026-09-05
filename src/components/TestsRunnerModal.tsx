/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Play, ShieldCheck, RefreshCw } from 'lucide-react';
import { BusinessTestsRunner, TestSuiteResult } from '../engine/businessTests';

interface TestsRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestsRunnerModal: React.FC<TestsRunnerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [suiteResult, setSuiteResult] = useState<TestSuiteResult | null>(() => {
    return BusinessTestsRunner.runSuite();
  });
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = BusinessTestsRunner.runSuite();
      setSuiteResult(res);
      setIsRunning(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Banc de Tests Métier & Certification (Section 27)</h3>
              <p className="text-xs text-slate-500">Suite d'assurance qualité autonome validant les règles R01 à R40</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        {suiteResult && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">
                Résultat global : <strong>{suiteResult.passed}</strong> / <strong>{suiteResult.total}</strong> tests validés
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                suiteResult.failed === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {suiteResult.failed === 0 ? '100% SUCCÈS - CERTIFIÉ CONFORME' : `${suiteResult.failed} ÉCHEC(S)`}
              </span>
            </div>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
              <span>Re-lancer les tests</span>
            </button>
          </div>
        )}

        {/* Test Cases List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 text-xs">
          {suiteResult?.results.map(test => (
            <div
              key={test.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                test.passed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {test.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{test.id}</span>
                    <span className="font-semibold text-slate-800">{test.name}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{test.message}</p>
                </div>
              </div>

              <span className="font-mono text-[10px] text-slate-400 shrink-0">{test.durationMs} ms</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
