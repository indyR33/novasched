/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { X, History, Plus, Lock, CheckCircle2, GitCompare, ArrowRight, Eye, Archive } from 'lucide-react';
import { PlanningVersion, VersionDiffItem, Employee } from '../types/planning';

interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: PlanningVersion[];
  currentVersionId: string;
  employees: Employee[];
  onSelectVersion: (versionId: string) => void;
  onCreateVersion: (name: string, comment: string, cloneFromCurrent: boolean) => void;
  onPublishVersion: (versionId: string) => void;
  onArchiveVersion: (versionId: string) => void;
}

export const VersionsModal: React.FC<VersionsModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  employees,
  onSelectVersion,
  onCreateVersion,
  onPublishVersion,
  onArchiveVersion
}) => {
  const [tab, setTab] = useState<'LIST' | 'CREATE' | 'COMPARE'>('LIST');
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionComment, setNewVersionComment] = useState('');
  const [cloneFromCurrent, setCloneFromCurrent] = useState(true);

  // Comparison state
  const [compareVersionAId, setCompareVersionAId] = useState(versions[0]?.id || '');
  const [compareVersionBId, setCompareVersionBId] = useState(versions[1]?.id || versions[0]?.id || '');

  if (!isOpen) return null;

  const currentVersion = versions.find(v => v.id === currentVersionId);
  const versionA = versions.find(v => v.id === compareVersionAId);
  const versionB = versions.find(v => v.id === compareVersionBId);

  // Compute diff between versionA and versionB (R29)
  const diffItems: VersionDiffItem[] = useMemo(() => {
    if (!versionA || !versionB || versionA.id === versionB.id) return [];

    const empMap = new Map<string, Employee>(employees.map(e => [e.id, e]));
    const asgsA = new Map<string, typeof versionA.assignments[0]>();
    const asgsB = new Map<string, typeof versionB.assignments[0]>();

    (versionA.assignments || []).forEach(a => asgsA.set(`${a.employeeId}_${a.date}`, a));
    (versionB.assignments || []).forEach(a => asgsB.set(`${a.employeeId}_${a.date}`, a));

    const allKeys = new Set([...asgsA.keys(), ...asgsB.keys()]);
    const diffs: VersionDiffItem[] = [];

    allKeys.forEach(key => {
      const a = asgsA.get(key);
      const b = asgsB.get(key);

      const oldShift = a?.shiftCode;
      const newShift = b?.shiftCode;

      if (oldShift !== newShift) {
        const [empId, date] = key.split('_');
        const emp = empMap.get(empId);
        const oldHours = a?.countedHours || 0;
        const newHours = b?.countedHours || 0;

        diffs.push({
          date,
          employeeId: empId,
          employeeName: emp ? `${emp.lastName} ${emp.firstName}` : empId,
          oldShiftCode: oldShift || 'OFF',
          newShiftCode: newShift || 'OFF',
          oldHours,
          newHours,
          isS3Changed: oldShift === 'S3' || newShift === 'S3',
          isSundayChanged: new Date(date).getDay() === 0
        });
      }
    });

    return diffs.sort((a, b) => a.date.localeCompare(b.date));
  }, [versionA, versionB, employees]);

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
              <h3 className="text-base font-bold text-slate-900">Gestion des Versions du Planning</h3>
              <p className="text-xs text-slate-500">Traçabilité complète, publication et comparateur d’écarts (R29, R34, R35)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 gap-4 text-xs font-semibold">
          <button
            onClick={() => setTab('LIST')}
            className={`py-3 border-b-2 ${
              tab === 'LIST' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Versions Existantes ({versions.length})
          </button>
          <button
            onClick={() => setTab('CREATE')}
            className={`py-3 border-b-2 ${
              tab === 'CREATE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            + Nouvelle Version
          </button>
          <button
            onClick={() => setTab('COMPARE')}
            className={`py-3 border-b-2 flex items-center gap-1 ${
              tab === 'COMPARE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Comparer Deux Versions</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto text-xs">
          {tab === 'LIST' && (
            <div className="space-y-3">
              {versions.map(ver => {
                const isSelected = ver.id === currentVersionId;
                const isPub = ver.status === 'PUBLISHED';
                const isArchived = ver.status === 'ARCHIVED';

                return (
                  <div
                    key={ver.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{ver.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                          v{ver.versionNumber}
                        </span>
                        {isPub ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                            <Lock className="w-2.5 h-2.5" /> Publiée
                          </span>
                        ) : isArchived ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600">
                            Archivée
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                            Brouillon
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500">{ver.comment || 'Aucune note'}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Créée par {ver.author} • {ver.assignments.length} affectations • Score {ver.validationScore}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectVersion(ver.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-medium text-slate-700"
                        >
                          Charger
                        </button>
                      )}

                      {!isPub && !isArchived && (
                        <button
                          type="button"
                          onClick={() => onPublishVersion(ver.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 shadow-2xs"
                          title="Publier et verrouiller en lecture seule (R35)"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Publier</span>
                        </button>
                      )}

                      {!isArchived && isPub && (
                        <button
                          type="button"
                          onClick={() => onArchiveVersion(ver.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          title="Archiver"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'CREATE' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom de la version</label>
                <input
                  type="text"
                  placeholder="Ex: Version Validée Septembre - Équipe A & B"
                  value={newVersionName}
                  onChange={e => setNewVersionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Note de version / Commentaire</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Prise en compte du remplacement d'urgence de Marc DUPONT et rééquilibrage des S3..."
                  value={newVersionComment}
                  onChange={e => setNewVersionComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cloneFromCurrent}
                    onChange={e => setCloneFromCurrent(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Dupliquer les affectations de la version active ({currentVersion?.name})
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Recommandé : permet de faire évoluer le planning sans écraser la version précédente (R34).
                </p>
              </div>

              <button
                type="button"
                disabled={!newVersionName.trim()}
                onClick={() => {
                  onCreateVersion(newVersionName, newVersionComment, cloneFromCurrent);
                  setTab('LIST');
                  setNewVersionName('');
                  setNewVersionComment('');
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:opacity-40 transition-colors shadow-xs"
              >
                Créer la version
              </button>
            </div>
          )}

          {tab === 'COMPARE' && (
            <div className="space-y-4">
              {/* Selectors */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Version A (Référence)</label>
                  <select
                    value={compareVersionAId}
                    onChange={e => setCompareVersionAId(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>{v.name} (v{v.versionNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Version B (Comparée)</label>
                  <select
                    value={compareVersionBId}
                    onChange={e => setCompareVersionBId(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>{v.name} (v{v.versionNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diff summary */}
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Total écarts détectés : <strong>{diffItems.length}</strong> cellule(s) modifiée(s)</span>
                {diffItems.some(d => d.isS3Changed) && (
                  <span className="text-violet-700 font-semibold">Impact sur les fermetures S3</span>
                )}
              </div>

              {/* Diff Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {diffItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    Aucun écart constaté entre ces deux versions.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Collaborateur</th>
                        <th className="p-2 text-center">Ancien (A)</th>
                        <th className="p-2 text-center">Nouveau (B)</th>
                        <th className="p-2 text-right">Variation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {diffItems.map((item, idx) => {
                        const hoursDelta = Math.round((item.newHours - item.oldHours) * 10) / 10;
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-slate-600">{item.date}</td>
                            <td className="p-2 font-semibold text-slate-900">{item.employeeName}</td>
                            <td className="p-2 text-center">
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                                {item.oldShiftCode}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                item.newShiftCode === 'S3' ? 'bg-violet-100 text-violet-900' : 'bg-indigo-100 text-indigo-900'
                              }`}>
                                {item.newShiftCode}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono">
                              <span className={hoursDelta > 0 ? 'text-indigo-600 font-bold' : hoursDelta < 0 ? 'text-rose-600' : 'text-slate-400'}>
                                {hoursDelta > 0 ? `+${hoursDelta}h` : `${hoursDelta}h`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
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
