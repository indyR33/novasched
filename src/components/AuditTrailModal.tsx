/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldAlert, History, Filter, Search, ShieldCheck } from 'lucide-react';
import { AuditLog } from '../types/planning';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  isOpen,
  onClose,
  logs
}) => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const actions = Array.from(new Set(logs.map(l => l.action))).sort();

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.actor.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q)) ||
        (log.reason && log.reason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Journal d'Audit & Traçabilité (R36)</h3>
              <p className="text-xs text-slate-500">Historique immuable de toutes les actions, modifications et dérogations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher utilisateur, motif..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="ALL">Toutes les actions</option>
            {actions.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Log list */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 text-xs divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">Aucun événement d'audit enregistré.</div>
          ) : (
            filteredLogs.map(log => {
              const isOverride = log.action === 'OVERRIDE_APPLIED';

              return (
                <div key={log.id} className="pt-2 pb-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isOverride ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-900">{log.actor}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  <p className="text-slate-700">{log.details}</p>

                  {log.reason && (
                    <div className="p-2 bg-amber-50/70 border border-amber-200 rounded text-[11px] text-amber-900 font-medium">
                      <strong>Motif de dérogation :</strong> {log.reason}
                    </div>
                  )}
                </div>
              );
            })
          )}
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
