/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [tab, setTab] = useState<'LIST' | 'CREATE' | 'COMPARE'>('LIST');
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionComment, setNewVersionComment] = useState('');
  const [cloneFromCurrent, setCloneFromCurrent] = useState(true);

  // Comparison state
  const [compareVersionAId, setCompareVersionAId] = useState(versions[0]?.id || '');
  const [compareVersionBId, setCompareVersionBId] = useState(versions[1]?.id || versions[0]?.id || '');

  const currentVersion = versions.find(v => v.id === currentVersionId);
  const versionA = versions.find(v => v.id === compareVersionAId);
  const versionB = versions.find(v => v.id === compareVersionBId);

  // Compute diff between versionA and versionB (R29)
  // Hook is declared unconditionally before any early return
  const diffItems: VersionDiffItem[] = useMemo(() => {
    if (!isOpen || !versionA || !versionB || versionA.id === versionB.id) return [];

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
  }, [isOpen, versionA, versionB, employees]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6] flex items-center justify-center text-white shadow-xs">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E293B]">
                {isEn ? 'Planning Versions Management' : 'Gestion des Versions du Planning'}
              </h3>
              <p className="text-xs text-[#64748B]">
                {isEn 
                  ? 'Audit trail, publication, and comparison diff tool (R29, R34, R35)' 
                  : 'Traçabilité complète, publication et comparateur d’écarts (R29, R34, R35)'}
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

        {/* Tabs */}
        <div className="flex border-b border-[#E2E8F0] px-5 gap-4 text-xs font-semibold">
          <button
            onClick={() => setTab('LIST')}
            className={`py-3 border-b-2 transition-colors ${
              tab === 'LIST' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {isEn ? `Existing Versions (${versions.length})` : `Versions Existantes (${versions.length})`}
          </button>
          <button
            onClick={() => setTab('CREATE')}
            className={`py-3 border-b-2 transition-colors ${
              tab === 'CREATE' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            {isEn ? '+ New Version' : '+ Nouvelle Version'}
          </button>
          <button
            onClick={() => setTab('COMPARE')}
            className={`py-3 border-b-2 flex items-center gap-1 transition-colors ${
              tab === 'COMPARE' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{isEn ? 'Compare Two Versions' : 'Comparer Deux Versions'}</span>
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
                        ? 'border-[#3B82F6] bg-[#EFF6FF]/40 ring-1 ring-[#3B82F6]/30'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1E293B]">{ver.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] font-semibold text-[#64748B]">
                          v{ver.versionNumber}
                        </span>
                        {isPub ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                            <Lock className="w-2.5 h-2.5" /> {isEn ? 'Published' : 'Publiée'}
                          </span>
                        ) : isArchived ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                            {isEn ? 'Archived' : 'Archivée'}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#FFFBEB] text-[#F59E0B] border border-[#FDE68A]">
                            {isEn ? 'Draft' : 'Brouillon'}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#64748B]">{ver.comment || (isEn ? 'No notes' : 'Aucune note')}</p>
                      <div className="text-[10px] text-[#94A3B8] font-mono">
                        {isEn ? 'Created by' : 'Créée par'} {ver.author} • {ver.assignments.length} {isEn ? 'assignments' : 'affectations'} • Score {ver.validationScore}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={() => onSelectVersion(ver.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] hover:bg-[#F8FAFC] font-medium text-[#334155]"
                        >
                          {isEn ? 'Load' : 'Charger'}
                        </button>
                      )}

                      {!isPub && !isArchived && (
                        <button
                          type="button"
                          onClick={() => onPublishVersion(ver.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-semibold flex items-center gap-1 shadow-2xs"
                          title={isEn ? 'Publish and lock read-only (R35)' : 'Publier et verrouiller en lecture seule (R35)'}
                        >
                          <Lock className="w-3 h-3" />
                          <span>{isEn ? 'Publish' : 'Publier'}</span>
                        </button>
                      )}

                      {!isArchived && isPub && (
                        <button
                          type="button"
                          onClick={() => onArchiveVersion(ver.id)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9]"
                          title={isEn ? 'Archive' : 'Archiver'}
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
                <label className="block font-semibold text-[#334155] mb-1">
                  {isEn ? 'Version Name' : 'Nom de la version'}
                </label>
                <input
                  type="text"
                  placeholder={isEn ? 'e.g. Validated September Version - Teams A & B' : 'Ex: Version Validée Septembre - Équipe A & B'}
                  value={newVersionName}
                  onChange={e => setNewVersionName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-xs text-[#1E293B]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#334155] mb-1">
                  {isEn ? 'Release Note / Comments' : 'Note de version / Commentaire'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isEn ? 'e.g. Emergency shift swap for agent and rebalancing S3 shifts...' : 'Ex: Prise en compte du remplacement d\'urgence et rééquilibrage des S3...'}
                  value={newVersionComment}
                  onChange={e => setNewVersionComment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B82F6] text-xs text-[#1E293B]"
                />
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={cloneFromCurrent}
                    onChange={e => setCloneFromCurrent(e.target.checked)}
                    className="rounded text-[#3B82F6] focus:ring-[#3B82F6]"
                  />
                  <span className="font-semibold text-[#1E293B]">
                    {isEn 
                      ? `Duplicate assignments from active version (${currentVersion?.name})` 
                      : `Dupliquer les affectations de la version active (${currentVersion?.name})`}
                  </span>
                </label>
                <p className="text-[11px] text-[#64748B] mt-1 pl-5">
                  {isEn 
                    ? 'Recommended: allows fine-tuning planning without overwriting previous versions (R34).' 
                    : 'Recommandé : permet de faire évoluer le planning sans écraser la version précédente (R34).'}
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
                className="w-full py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-lg disabled:opacity-40 transition-colors shadow-xs"
              >
                {isEn ? 'Create Version' : 'Créer la version'}
              </button>
            </div>
          )}

          {tab === 'COMPARE' && (
            <div className="space-y-4">
              {/* Selectors */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">
                    {isEn ? 'Version A (Baseline)' : 'Version A (Référence)'}
                  </label>
                  <select
                    value={compareVersionAId}
                    onChange={e => setCompareVersionAId(e.target.value)}
                    className="w-full p-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B]"
                  >
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>{v.name} (v{v.versionNumber})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] font-semibold mb-1">
                    {isEn ? 'Version B (Compared)' : 'Version B (Comparée)'}
                  </label>
                  <select
                    value={compareVersionBId}
                    onChange={e => setCompareVersionBId(e.target.value)}
                    className="w-full p-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs text-[#1E293B]"
                  >
                    {versions.map(v => (
                      <option key={v.id} value={v.id}>{v.name} (v{v.versionNumber})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Diff summary */}
              <div className="flex items-center justify-between text-xs text-[#64748B] font-medium">
                <span>
                  {isEn ? 'Total detected differences:' : 'Total écarts détectés :'} <strong>{diffItems.length}</strong> {isEn ? 'modified cell(s)' : 'cellule(s) modifiée(s)'}
                </span>
                {(diffItems || []).some(d => d.isS3Changed) && (
                  <span className="text-[#3B82F6] font-semibold">
                    {isEn ? 'Impact on late S3 closures' : 'Impact sur les fermetures S3'}
                  </span>
                )}
              </div>

              {/* Diff Table */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {diffItems.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8]">
                    <CheckCircle2 className="w-6 h-6 text-[#10B981] mx-auto mb-1" />
                    {isEn ? 'No differences detected between these two versions.' : 'Aucun écart constaté entre ces deux versions.'}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs divide-y divide-[#E2E8F0]">
                    <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">{isEn ? 'Collaborator' : 'Collaborateur'}</th>
                        <th className="p-2 text-center">{isEn ? 'Old (A)' : 'Ancien (A)'}</th>
                        <th className="p-2 text-center">{isEn ? 'New (B)' : 'Nouveau (B)'}</th>
                        <th className="p-2 text-right">{isEn ? 'Variation' : 'Variation'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {diffItems.map((item, idx) => {
                        const hoursDelta = Math.round((item.newHours - item.oldHours) * 10) / 10;
                        return (
                          <tr key={idx} className="hover:bg-[#F8FAFC]">
                            <td className="p-2 font-mono text-[#64748B]">{item.date}</td>
                            <td className="p-2 font-semibold text-[#1E293B]">{item.employeeName}</td>
                            <td className="p-2 text-center">
                              <span className="px-2 py-0.5 rounded bg-[#F1F5F9] font-bold text-[#64748B] border border-[#E2E8F0]">
                                {item.oldShiftCode}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded font-bold border ${
                                item.newShiftCode === 'S3' 
                                  ? 'bg-violet-100 text-violet-900 border-violet-200' 
                                  : 'bg-blue-100 text-blue-900 border-blue-200'
                              }`}>
                                {item.newShiftCode}
                              </span>
                            </td>
                            <td className="p-2 text-right font-mono">
                              <span className={hoursDelta > 0 ? 'text-[#3B82F6] font-bold' : hoursDelta < 0 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}>
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
        <div className="px-5 py-3 border-t border-[#E2E8F0] flex justify-end bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B] rounded-lg transition-colors"
          >
            {isEn ? 'Close' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
