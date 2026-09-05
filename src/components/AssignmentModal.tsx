/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, Clock, Calendar, User, ShieldCheck } from 'lucide-react';
import {
  Employee,
  Shift,
  Assignment,
  Qualification,
  UserRole
} from '../types/planning';
import { getAvailableShiftsForEmployee } from '../engine/rulesEngine';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  date: string;
  currentAssignment?: Assignment;
  shifts: Shift[];
  qualifications: Qualification[];
  userRole: UserRole;
  onSave: (shiftCode: string, isOverride: boolean, overrideReason: string, comment: string) => void;
  onDelete: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  date,
  currentAssignment,
  shifts,
  qualifications,
  userRole,
  onSave,
  onDelete
}) => {
  const { i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [selectedCode, setSelectedCode] = useState<string>(currentAssignment?.shiftCode || 'OFF');
  const [isOverride, setIsOverride] = useState<boolean>(currentAssignment?.isOverride || false);
  const [overrideReason, setOverrideReason] = useState<string>(currentAssignment?.overrideReason || '');
  const [comment, setComment] = useState<string>(currentAssignment?.comment || '');

  // Reset when opening
  React.useEffect(() => {
    if (isOpen) {
      setSelectedCode(currentAssignment?.shiftCode || 'OFF');
      setIsOverride(currentAssignment?.isOverride || false);
      setOverrideReason(currentAssignment?.overrideReason || '');
      setComment(currentAssignment?.comment || '');
    }
  }, [isOpen, currentAssignment]);

  // Contextual choices (R05)
  const availableChoices = useMemo(() => {
    return getAvailableShiftsForEmployee(
      employee,
      date,
      shifts,
      qualifications,
      userRole === 'ADMIN' // Admin can see non-authorized shifts as override candidates
    );
  }, [employee, date, shifts, qualifications, userRole]);

  const selectedShift = shifts.find(s => s.code === selectedCode);
  const choiceInfo = availableChoices.find(c => c.shift.code === selectedCode);
  const isSelectedAuthorized = choiceInfo?.isAuthorized ?? true;
  const refusalReason = choiceInfo?.reason;

  const requiresOverride = !isSelectedAuthorized || (choiceInfo && choiceInfo.reason?.startsWith('R01'));

  const canSubmit = useMemo(() => {
    if (requiresOverride) {
      if (userRole !== 'ADMIN') return false;
      if (!isOverride) return false;
      if (!overrideReason || overrideReason.trim().length < 5) return false;
    }
    return true;
  }, [requiresOverride, userRole, isOverride, overrideReason]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <h3 className="text-base font-bold text-[#1E293B]">
              {isEn ? 'Edit Assignment' : "Modifier l'affectation"}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
              <span className="flex items-center gap-1 font-medium text-[#1E293B]">
                <User className="w-3.5 h-3.5 text-[#3B82F6]" />
                {employee.lastName} {employee.firstName} ({employee.matricule})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                {date}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Shift Selection Cards */}
          <div>
            <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
              {isEn ? 'Choose a Shift or Status' : 'Choisir un Shift ou Statut'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableChoices.map(({ shift, isAuthorized, reason }) => {
                const isSelected = selectedCode === shift.code;
                const isBlocked = !isAuthorized && userRole !== 'ADMIN';

                return (
                  <button
                    key={shift.code}
                    type="button"
                    disabled={isBlocked}
                    onClick={() => {
                      setSelectedCode(shift.code);
                      if (reason) {
                        setIsOverride(true);
                      } else {
                        setIsOverride(false);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20 bg-[#EFF6FF]/40'
                        : isBlocked
                        ? 'opacity-40 bg-[#F8FAFC] border-[#E2E8F0] cursor-not-allowed'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{shift.code}</span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {shift.countedHours}h {isEn ? 'paid' : 'payées'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 truncate mt-1">{shift.label}</div>
                    {!isAuthorized && (
                      <div className="mt-1 text-[10px] text-rose-600 font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 shrink-0" />
                        <span className="truncate">{reason || (isEn ? 'Not qualified' : 'Non habilité')}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Shift Details & Rule Explanations (R15, R24) */}
          {selectedShift && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">{isEn ? 'Time span:' : 'Amplitude horaire :'}</span>
                <span className="font-mono">
                  {selectedShift.startTime} → {selectedShift.endTime}{' '}
                  {selectedShift.isOvernight && (isEn ? '(Night - crosses midnight)' : '(Nuit - traverse minuit)')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-medium">{isEn ? 'Theoretical vs counted hours (R15):' : 'Heures théoriques vs comptabilisées (R15) :'}</span>
                <span className="font-mono">
                  {selectedShift.theoreticalDuration}h {isEn ? 'theoretical' : 'théoriques'} |{' '}
                  <strong className="text-indigo-700">{selectedShift.countedHours}h {isEn ? 'counted' : 'comptabilisées'}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Override Panel if Hard Constraint Violated (R01, R36) */}
          {requiresOverride && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2.5">
              <div className="flex items-start gap-2 text-amber-900 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div>{isEn ? 'HARD Constraint Violation Warning (R01 / R02)' : 'Alerte de Violation de Règle HARD (R01 / R02)'}</div>
                  <p className="font-normal text-amber-800 text-[11px] mt-0.5">
                    {refusalReason || (isEn ? 'This employee is not qualified for this shift according to rules.' : 'Cet employé n’est pas qualifié pour ce shift selon le référentiel.')}
                  </p>
                </div>
              </div>

              {userRole === 'ADMIN' ? (
                <div className="space-y-2 pt-1 border-t border-amber-200/80">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOverride}
                      onChange={e => setIsOverride(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-bold text-amber-950">
                      {isEn ? 'Apply Exceptional Override (Mandatory traceability)' : 'Appliquer un Override Dérogatoire Exceptionnel (Traçabilité obligatoire)'}
                    </span>
                  </label>

                  {isOverride && (
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                        {isEn ? 'Mandatory explicit reason (Rule R36):' : 'Motif explicite obligatoire (Règle R36) :'}
                      </label>
                      <input
                        type="text"
                        placeholder={isEn ? 'e.g. Emergency replacement authorized by management...' : 'Ex: Remplacement d’urgence validé par la direction...'}
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      {(!overrideReason || overrideReason.trim().length < 5) && (
                        <p className="text-[10px] text-rose-600 mt-1">
                          {isEn ? 'Please enter a justification reason (min 5 characters).' : 'Veuillez saisir un motif justificatif (min 5 caractères).'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-rose-700 font-medium">
                  {isEn ? 'Only an Administrator can authorize an exceptional override for this shift.' : 'Seul un Administrateur peut autoriser une dérogation exceptionnelle pour ce shift.'}
                </p>
              )}
            </div>
          )}

          {/* User Annotation / Comment (R28) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isEn ? 'Comment / Annotation (Rule R28)' : 'Commentaire / Annotation (Règle R28)'}
            </label>
            <input
              type="text"
              placeholder={isEn ? 'Operational note or detail...' : 'Note opérationnelle ou précision...'}
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          {currentAssignment ? (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs text-[#EF4444] hover:text-[#DC2626] font-medium px-2 py-1 transition-colors"
            >
              {isEn ? 'Set to Rest (OFF)' : 'Mettre en Repos (OFF)'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            >
              {isEn ? 'Cancel' : 'Annuler'}
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                onSave(selectedCode, isOverride, overrideReason, comment);
                onClose();
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-xs transition-colors ${
                canSubmit
                  ? 'bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8]'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              {isEn ? 'Save' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
