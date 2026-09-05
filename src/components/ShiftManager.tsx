/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, Plus, Edit2, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Shift, UserRole } from '../types/planning';
import { SHIFT_LABELS_EN } from '../utils/i18nData';

interface ShiftManagerProps {
  shifts: Shift[];
  userRole: UserRole;
  onUpdateShift: (shift: Shift) => void;
  onAddShift: (shift: Shift) => void;
}

export const ShiftManager: React.FC<ShiftManagerProps> = ({
  shifts,
  userRole,
  onUpdateShift,
  onAddShift
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getShiftLabel = (shift: Shift) => {
    if (isEn && SHIFT_LABELS_EN[shift.code]) {
      return SHIFT_LABELS_EN[shift.code];
    }
    return shift.label;
  };

  const getShiftTypeLabel = (type: string) => {
    if (type === 'travail') return t('shifts.typeWork');
    if (type === 'repos') return t('shifts.typeRest');
    return t('shifts.typeAbsence');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6]">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">{t('shifts.title')}</h2>
            <p className="text-xs text-[#64748B]">
              {t('shifts.subtitle')}
            </p>
          </div>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => {
              setEditingShift({
                code: '',
                label: '',
                startTime: '08:00',
                endTime: '16:30',
                isOvernight: false,
                theoreticalDuration: 8.5,
                countedHours: 7.5,
                family: 'M',
                subFamily: 'M',
                type: 'travail',
                isActive: true,
                colorBg: 'bg-indigo-50',
                colorText: 'text-indigo-900',
                colorBorder: 'border-indigo-300'
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3B82F6] text-white font-semibold text-xs shadow-xs hover:bg-[#2563EB] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('shifts.newShift')}</span>
          </button>
        )}
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {shifts.map(shift => (
          <div
            key={shift.code}
            className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-2.5 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md font-bold text-xs border ${shift.colorBg} ${shift.colorText} ${shift.colorBorder}`}>
                  {shift.code}
                </span>
                <div>
                  <div className="font-bold text-xs text-[#1E293B]">{getShiftLabel(shift)}</div>
                  <div className="text-[10px] text-[#64748B] capitalize">
                    {t('shifts.modalType')}: {getShiftTypeLabel(shift.type)} • {t('shifts.modalFamily')} {shift.family}
                  </div>
                </div>
              </div>

              {shift.isOvernight && (
                <span className="p-1 rounded bg-[#0F172A] text-white text-[9px] flex items-center gap-1 font-semibold" title={t('shifts.nightTip')}>
                  <Moon className="w-2.5 h-2.5" /> {t('shifts.nightBadge')}
                </span>
              )}
            </div>

            <div className="p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs space-y-1 font-mono">
              <div className="flex justify-between text-[#64748B]">
                <span>{t('shifts.timeRange')}</span>
                <strong className="text-[#1E293B]">{shift.startTime} → {shift.endTime}</strong>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>{t('shifts.theoreticalDuration')}</span>
                <span className="text-[#1E293B]">{shift.theoreticalDuration} h</span>
              </div>
              <div className="flex justify-between text-[#1E293B] border-t border-[#E2E8F0] pt-1 font-bold">
                <span>{t('shifts.countedHours')}</span>
                <span className="text-[#3B82F6]">{shift.countedHours} h</span>
              </div>
            </div>

            {shift.notes && (
              <p className="text-[10px] text-slate-500 italic">{shift.notes}</p>
            )}

            {userRole === 'ADMIN' && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setEditingShift({ ...shift });
                    setIsModalOpen(true);
                  }}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium inline-flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> {t('common.edit')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Shift Modal */}
      {isModalOpen && editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              {(shifts || []).some(s => s.code === editingShift.code) ? `${t('shifts.editShift')} ${editingShift.code}` : t('shifts.newShift')}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('shifts.modalCode')}</label>
                  <input
                    type="text"
                    value={editingShift.code}
                    onChange={e => setEditingShift({ ...editingShift, code: e.target.value.toUpperCase() })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('shifts.modalFamily')}</label>
                  <select
                    value={editingShift.family}
                    onChange={e => setEditingShift({ ...editingShift, family: e.target.value as any })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="M">M ({isEn ? 'Morning' : 'Matin'})</option>
                    <option value="S">S ({isEn ? 'Evening' : 'Soir'})</option>
                    <option value="J">J ({isEn ? 'Day' : 'Journée'})</option>
                    <option value="N">N ({isEn ? 'Night' : 'Nuit'})</option>
                    <option value="T">T ({isEn ? 'Technical' : 'Technique'})</option>
                    <option value="REPOS">REPOS / REST</option>
                    <option value="ABS">ABS / LEAVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('shifts.modalLabel')}</label>
                <input
                  type="text"
                  value={editingShift.label}
                  onChange={e => setEditingShift({ ...editingShift, label: e.target.value })}
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('shifts.modalStart')}</label>
                  <input
                    type="time"
                    value={editingShift.startTime}
                    onChange={e => setEditingShift({ ...editingShift, startTime: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('shifts.modalEnd')}</label>
                  <input
                    type="time"
                    value={editingShift.endTime}
                    onChange={e => setEditingShift({ ...editingShift, endTime: e.target.value })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('shifts.theoreticalDuration')} (h)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={editingShift.theoreticalDuration}
                    onChange={e => setEditingShift({ ...editingShift, theoreticalDuration: Number(e.target.value) })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('shifts.countedHours')} (h)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={editingShift.countedHours}
                    onChange={e => setEditingShift({ ...editingShift, countedHours: Number(e.target.value) })}
                    className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingShift.isOvernight}
                  onChange={e => setEditingShift({ ...editingShift, isOvernight: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">{t('shifts.nightTip')}</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if ((shifts || []).some(s => s.code === editingShift.code)) {
                    onUpdateShift(editingShift);
                  } else {
                    onAddShift(editingShift);
                  }
                  setIsModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
