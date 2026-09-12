/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
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

  // Immediate apply handler when clicking a shift card
  const handleShiftCardClick = (shift: Shift, isAuthorized: boolean, reason?: string) => {
    if (!isAuthorized) {
      if (userRole === 'ADMIN') {
        setSelectedCode(shift.code);
        setIsOverride(true);
      }
      return;
    }

    // Immediately apply and dismiss modal (skips having to click "Enregistrer")
    onSave(shift.code, false, '', comment);
    onClose();
  };

  if (!isOpen) return null;

  // Helper for shift family styling badges
  const getFamilyBadge = (family?: string) => {
    switch (family) {
      case 'MATIN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SOIR':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'NUIT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'REPOS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ABS':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

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
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-[#FAFCFF]/50">
          {/* Quick Apply Callout Banner */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/80 text-blue-900 text-xs shadow-2xs">
            <div className="flex items-center gap-2 font-medium">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <span className="font-semibold">{isEn ? 'Instant 1-Click Apply' : 'Application instantanée 1-clic'}</span>
                <p className="text-[11px] text-blue-700 font-normal">
                  {isEn
                    ? 'Click any shift below to apply it immediately.'
                    : 'Cliquez sur un shift pour l’appliquer immédiatement sans valider.'}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-white px-2 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
              <Sparkles className="w-3 h-3 text-blue-500" />
              {isEn ? 'Direct' : 'Direct'}
            </span>
          </div>

          {/* Shift Selection Cards */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                {isEn ? 'Choose a Shift or Status' : 'Choisir un Shift ou Statut'}
              </label>
              <span className="text-[11px] text-slate-400">
                {availableChoices.length} {isEn ? 'available' : 'disponibles'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {availableChoices.map(({ shift, isAuthorized, reason }) => {
                const isCurrent = currentAssignment?.shiftCode === shift.code;
                const isSelected = selectedCode === shift.code;
                const isBlocked = !isAuthorized && userRole !== 'ADMIN';

                return (
                  <button
                    key={shift.code}
                    type="button"
                    disabled={isBlocked}
                    onClick={() => handleShiftCardClick(shift, isAuthorized, reason)}
                    className={`group relative p-3 rounded-xl border text-left flex flex-col justify-between transition-all select-none ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                        : isSelected && requiresOverride
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : isBlocked
                        ? 'opacity-40 bg-[#F8FAFC] border-[#E2E8F0] cursor-not-allowed'
                        : 'border-[#E2E8F0] bg-white hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-xs active:scale-[0.98] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                          {shift.code}
                        </span>
                        <span className={`text-[10px] font-semibold border px-1.5 py-0.5 rounded-md ${getFamilyBadge(shift.family)}`}>
                          {shift.family || 'POSTE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCurrent && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            {isEn ? 'Active' : 'Actuel'}
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {shift.countedHours}h
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 truncate mt-1.5 font-medium">
                      {shift.label}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-500">
                        {shift.startTime ? `${shift.startTime} - ${shift.endTime}` : (isEn ? 'All day' : 'Journée')}
                      </span>

                      {!isAuthorized ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1 truncate max-w-[120px]">
                          <ShieldAlert className="w-3 h-3 shrink-0" />
                          <span className="truncate">{reason || (isEn ? 'Not qualified' : 'Non habilité')}</span>
                        </span>
                      ) : (
                        <span className="text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          {isEn ? 'Apply' : 'Appliquer'}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
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
              placeholder={isEn ? 'Optional note (will be saved when clicking a shift)...' : 'Note optionnelle (sera enregistrée au clic sur un shift)...'}
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
          {currentAssignment ? (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="text-xs text-[#EF4444] hover:text-[#DC2626] font-medium px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1"
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
              className="px-3.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            >
              {isEn ? 'Cancel' : 'Annuler'}
            </button>

            {requiresOverride ? (
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
                {isEn ? 'Save Override' : 'Enregistrer la dérogation'}
              </button>
            ) : comment.trim() && comment !== (currentAssignment?.comment || '') ? (
              <button
                type="button"
                onClick={() => {
                  onSave(selectedCode, false, '', comment);
                  onClose();
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
              >
                {isEn ? 'Save Note' : 'Enregistrer la note'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
