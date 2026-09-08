/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  Layers, 
  Minus, 
  Info,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CoverageRequirement, RotationPattern, Shift, ShiftFamily, UserRole } from '../types/planning';
import { ROTATION_PATTERNS_EN } from '../utils/i18nData';
import { INITIAL_COVERAGE, INITIAL_ROTATION_PATTERNS } from '../data/initialData';

interface CoverageManagerProps {
  coverageRequirements: CoverageRequirement[];
  rotationPatterns: RotationPattern[];
  shifts?: Shift[];
  userRole: UserRole;
  onUpdateCoverage: (reqs: CoverageRequirement[]) => void;
  onUpdateRotations: (patterns: RotationPattern[]) => void;
}

// Rule mapping helper
const getRuleForSubFamily = (subFamily: string) => {
  if (subFamily === 'M1') return 'R06';
  if (subFamily === 'M2') return 'R07';
  if (subFamily === 'S1') return 'R08';
  if (subFamily === 'S3') return 'R09';
  return 'R33';
};

const COMMON_SUBFAMILIES = ['M1', 'M2', 'M3', 'S1', 'S2', 'S3', 'N', 'J', 'T'];
const SHIFT_FAMILIES: ShiftFamily[] = ['M', 'S', 'J', 'N', 'T', 'ABS', 'REPOS', 'AUTRE'];

export const CoverageManager: React.FC<CoverageManagerProps> = ({
  coverageRequirements,
  rotationPatterns,
  shifts = [],
  userRole,
  onUpdateCoverage,
  onUpdateRotations
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [activeSubTab, setActiveSubTab] = useState<'COVERAGE' | 'ROTATION'>('COVERAGE');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'DEFAULT_WEEKDAY' | 'DEFAULT_WEEKEND' | 'SPECIFIC'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Coverage Modal state
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
  const [editingCoverage, setEditingCoverage] = useState<CoverageRequirement | null>(null);

  // Rotation Modal state
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);
  const [editingRotation, setEditingRotation] = useState<RotationPattern | null>(null);

  // Deletion / Reset confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'DELETE_COVERAGE' | 'DELETE_ROTATION' | 'RESET_COVERAGE' | 'RESET_ROTATION';
    id?: string;
    title: string;
    message: string;
  } | null>(null);

  const isReadOnly = userRole === 'VIEWER';

  // Available shift codes from shifts prop or defaults
  const availableShiftCodes = useMemo(() => {
    if (shifts && shifts.length > 0) {
      return shifts.map(s => s.code);
    }
    return ['M1', 'M2', 'S1', 'S2', 'S3', 'N', 'J', 'T', 'OFF'];
  }, [shifts]);

  // Color lookup for shifts
  const getShiftColor = (code: string) => {
    const s = shifts.find(item => item.code === code || item.subFamily === code);
    if (s) {
      return { bg: s.colorBg, text: s.colorText, border: s.colorBorder };
    }
    if (code.startsWith('M')) return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    if (code.startsWith('S')) return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' };
    if (code === 'N') return { bg: 'bg-slate-800', text: 'text-slate-100', border: 'border-slate-700' };
    return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
  };

  // --- STATS ---
  const stats = useMemo(() => {
    const total = coverageRequirements.length;
    const weekdays = coverageRequirements.filter(r => r.date === 'DEFAULT_WEEKDAY').length;
    const weekends = coverageRequirements.filter(r => r.date === 'DEFAULT_WEEKEND').length;
    const specific = coverageRequirements.filter(r => r.date !== 'DEFAULT_WEEKDAY' && r.date !== 'DEFAULT_WEEKEND').length;
    const highPriority = coverageRequirements.filter(r => r.priority === 'HAUTE').length;
    return { total, weekdays, weekends, specific, highPriority };
  }, [coverageRequirements]);

  // --- FILTERED COVERAGE REQUIREMENTS ---
  const filteredCoverage = useMemo(() => {
    return coverageRequirements.filter(req => {
      // Scope filter
      if (scopeFilter === 'DEFAULT_WEEKDAY' && req.date !== 'DEFAULT_WEEKDAY') return false;
      if (scopeFilter === 'DEFAULT_WEEKEND' && req.date !== 'DEFAULT_WEEKEND') return false;
      if (scopeFilter === 'SPECIFIC' && (req.date === 'DEFAULT_WEEKDAY' || req.date === 'DEFAULT_WEEKEND')) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesSubFamily = req.subFamily.toLowerCase().includes(query);
        const matchesDate = req.date.toLowerCase().includes(query);
        const matchesPriority = req.priority.toLowerCase().includes(query);
        if (!matchesSubFamily && !matchesDate && !matchesPriority) return false;
      }

      return true;
    });
  }, [coverageRequirements, scopeFilter, searchTerm]);

  // --- COVERAGE CRUD HANDLERS ---
  const handleOpenNewCoverage = () => {
    setEditingCoverage({
      id: `cov-${Date.now()}`,
      date: scopeFilter === 'DEFAULT_WEEKEND' ? 'DEFAULT_WEEKEND' : 'DEFAULT_WEEKDAY',
      subFamily: 'M1',
      minimum: 1,
      maximum: 2,
      priority: 'HAUTE'
    });
    setIsCoverageModalOpen(true);
  };

  const handleEditCoverage = (req: CoverageRequirement) => {
    setEditingCoverage({ ...req });
    setIsCoverageModalOpen(true);
  };

  const handleDuplicateCoverage = (req: CoverageRequirement) => {
    setEditingCoverage({
      ...req,
      id: `cov-${Date.now()}`
    });
    setIsCoverageModalOpen(true);
  };

  const handleSaveCoverage = (req: CoverageRequirement) => {
    const exists = coverageRequirements.some(r => r.id === req.id);
    let updated: CoverageRequirement[];
    if (exists) {
      updated = coverageRequirements.map(r => (r.id === req.id ? req : r));
    } else {
      updated = [...coverageRequirements, req];
    }
    onUpdateCoverage(updated);
    setIsCoverageModalOpen(false);
    setEditingCoverage(null);
  };

  const handleDeleteCoverage = (id: string) => {
    const updated = coverageRequirements.filter(r => r.id !== id);
    onUpdateCoverage(updated);
    setConfirmDialog(null);
  };

  const handleQuickMinChange = (id: string, delta: number) => {
    if (isReadOnly) return;
    const updated = coverageRequirements.map(req => {
      if (req.id === id) {
        const newMin = Math.max(0, req.minimum + delta);
        const newMax = req.maximum !== undefined && req.maximum < newMin ? newMin : req.maximum;
        return { ...req, minimum: newMin, maximum: newMax };
      }
      return req;
    });
    onUpdateCoverage(updated);
  };

  const handleSetMinDirect = (id: string, val: number) => {
    if (isReadOnly) return;
    const updated = coverageRequirements.map(req => {
      if (req.id === id) {
        const newMin = Math.max(0, val);
        const newMax = req.maximum !== undefined && req.maximum < newMin ? newMin : req.maximum;
        return { ...req, minimum: newMin, maximum: newMax };
      }
      return req;
    });
    onUpdateCoverage(updated);
  };

  const handleResetCoverage = () => {
    onUpdateCoverage(INITIAL_COVERAGE);
    setConfirmDialog(null);
  };

  // --- ROTATION CRUD HANDLERS ---
  const handleOpenNewRotation = () => {
    setEditingRotation({
      id: `rot-${Date.now()}`,
      name: isEn ? 'New Custom Rotation Cycle' : 'Nouveau cycle de rotation personnalisé',
      description: isEn ? 'Balanced rotation sequence' : 'Séquence de travail et repos alternée',
      cycleLength: 7,
      isActive: true,
      steps: [
        { dayIndex: 0, requiredFamily: 'M', suggestedShiftCode: 'M1', isRest: false },
        { dayIndex: 1, requiredFamily: 'M', suggestedShiftCode: 'M2', isRest: false },
        { dayIndex: 2, requiredFamily: 'S', suggestedShiftCode: 'S1', isRest: false },
        { dayIndex: 3, requiredFamily: 'S', suggestedShiftCode: 'S3', isRest: false },
        { dayIndex: 4, requiredFamily: 'J', suggestedShiftCode: 'J', isRest: false },
        { dayIndex: 5, requiredFamily: 'OFF', suggestedShiftCode: 'OFF', isRest: true },
        { dayIndex: 6, requiredFamily: 'OFF', suggestedShiftCode: 'OFF', isRest: true }
      ]
    });
    setIsRotationModalOpen(true);
  };

  const handleEditRotation = (pattern: RotationPattern) => {
    setEditingRotation({
      ...pattern,
      steps: pattern.steps.map(s => ({ ...s }))
    });
    setIsRotationModalOpen(true);
  };

  const handleDuplicateRotation = (pattern: RotationPattern) => {
    setEditingRotation({
      ...pattern,
      id: `rot-${Date.now()}`,
      name: `${pattern.name} (${isEn ? 'Copy' : 'Copie'})`,
      steps: pattern.steps.map(s => ({ ...s }))
    });
    setIsRotationModalOpen(true);
  };

  const handleToggleRotationActive = (id: string) => {
    if (isReadOnly) return;
    const updated = rotationPatterns.map(p => {
      if (p.id === id) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    });
    onUpdateRotations(updated);
  };

  const handleSaveRotation = (pattern: RotationPattern) => {
    const exists = rotationPatterns.some(p => p.id === pattern.id);
    let updated: RotationPattern[];
    if (exists) {
      updated = rotationPatterns.map(p => (p.id === pattern.id ? pattern : p));
    } else {
      updated = [...rotationPatterns, pattern];
    }
    onUpdateRotations(updated);
    setIsRotationModalOpen(false);
    setEditingRotation(null);
  };

  const handleDeleteRotation = (id: string) => {
    const updated = rotationPatterns.filter(p => p.id !== id);
    onUpdateRotations(updated);
    setConfirmDialog(null);
  };

  const handleResetRotations = () => {
    onUpdateRotations(INITIAL_ROTATION_PATTERNS);
    setConfirmDialog(null);
  };

  // Group filtered coverage into sections
  const weekdayReqs = filteredCoverage.filter(r => r.date === 'DEFAULT_WEEKDAY');
  const weekendReqs = filteredCoverage.filter(r => r.date === 'DEFAULT_WEEKEND');
  const specificReqs = filteredCoverage.filter(r => r.date !== 'DEFAULT_WEEKDAY' && r.date !== 'DEFAULT_WEEKEND');

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#3B82F6] shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">{t('coverage.title')}</h2>
            <p className="text-xs text-[#64748B]">{t('coverage.subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab Switches */}
          <div className="inline-flex rounded-xl border border-[#E2E8F0] p-1 bg-[#F1F5F9] text-xs font-semibold">
            <button
              id="coverage-tab-btn"
              onClick={() => setActiveSubTab('COVERAGE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'COVERAGE'
                  ? 'bg-white text-[#3B82F6] shadow-xs font-bold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('coverage.tabCoverage')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#EFF6FF] text-[#3B82F6] font-bold">
                {coverageRequirements.length}
              </span>
            </button>
            <button
              id="rotations-tab-btn"
              onClick={() => setActiveSubTab('ROTATION')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'ROTATION'
                  ? 'bg-white text-[#3B82F6] shadow-xs font-bold'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('coverage.tabRotation')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {rotationPatterns.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: COVERAGE REQUIREMENTS */}
      {activeSubTab === 'COVERAGE' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Left: Search & Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder={isEn ? 'Filter sub-family or date...' : 'Filtrer sous-famille ou date...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] w-48 sm:w-56"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Scope Filters */}
              <div className="inline-flex rounded-lg border border-[#E2E8F0] p-0.5 bg-[#F8FAFC] text-xs font-medium">
                <button
                  onClick={() => setScopeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    scopeFilter === 'ALL' ? 'bg-[#3B82F6] text-white shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {isEn ? 'All' : 'Tous'} ({coverageRequirements.length})
                </button>
                <button
                  onClick={() => setScopeFilter('DEFAULT_WEEKDAY')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    scopeFilter === 'DEFAULT_WEEKDAY' ? 'bg-[#3B82F6] text-white shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {isEn ? 'Weekdays' : 'Semaine'} ({stats.weekdays})
                </button>
                <button
                  onClick={() => setScopeFilter('DEFAULT_WEEKEND')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    scopeFilter === 'DEFAULT_WEEKEND' ? 'bg-[#3B82F6] text-white shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {isEn ? 'Weekend' : 'Week-end'} ({stats.weekends})
                </button>
                <button
                  onClick={() => setScopeFilter('SPECIFIC')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    scopeFilter === 'SPECIFIC' ? 'bg-[#3B82F6] text-white shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {isEn ? 'Dates' : 'Dates précises'} ({stats.specific})
                </button>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <>
                  <button
                    id="coverage-btn-add"
                    onClick={handleOpenNewCoverage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('coverage.addRequirement')}</span>
                  </button>

                  <button
                    id="coverage-btn-reset"
                    onClick={() => {
                      setConfirmDialog({
                        type: 'RESET_COVERAGE',
                        title: t('coverage.resetDefaults'),
                        message: t('coverage.resetDefaultsConfirm')
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] text-xs font-medium transition-colors"
                    title={t('coverage.resetDefaults')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isEn ? 'Reset' : 'Réinitialiser'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Empty State */}
          {filteredCoverage.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-[#E2E8F0] shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">{t('coverage.noRequirements')}</h3>
                <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1">
                  {t('coverage.noRequirementsDesc')}
                </p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={handleOpenNewCoverage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3B82F6] text-white font-semibold text-xs shadow-xs hover:bg-[#2563EB] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('coverage.addRequirement')}</span>
                </button>
              )}
            </div>
          )}

          {/* Content Sections */}
          {filteredCoverage.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 1. WEEKDAY REQUIREMENTS */}
              {(scopeFilter === 'ALL' || scopeFilter === 'DEFAULT_WEEKDAY') && weekdayReqs.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
                      <div>
                        <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                          {t('coverage.weekdaysTitle')}
                        </h3>
                        <p className="text-[11px] text-[#64748B]">{t('coverage.weekdaysSubtitle')}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#3B82F6] font-bold border border-[#DBEAFE]">
                      DEFAULT_WEEKDAY
                    </span>
                  </div>

                  <div className="space-y-2">
                    {weekdayReqs.map(req => (
                      <CoverageRequirementCard
                        key={req.id}
                        req={req}
                        isReadOnly={isReadOnly}
                        isEn={isEn}
                        shiftColor={getShiftColor(req.subFamily)}
                        onEdit={() => handleEditCoverage(req)}
                        onDuplicate={() => handleDuplicateCoverage(req)}
                        onDelete={() => setConfirmDialog({
                          type: 'DELETE_COVERAGE',
                          id: req.id,
                          title: t('coverage.deleteRequirement'),
                          message: `${t('coverage.deleteConfirm')} (${req.subFamily} - ${req.date})`
                        })}
                        onStepMin={(delta) => handleQuickMinChange(req.id, delta)}
                        onSetMin={(val) => handleSetMinDirect(req.id, val)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 2. WEEKEND REQUIREMENTS */}
              {(scopeFilter === 'ALL' || scopeFilter === 'DEFAULT_WEEKEND') && weekendReqs.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      <div>
                        <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                          {t('coverage.weekendsTitle')}
                        </h3>
                        <p className="text-[11px] text-[#64748B]">{t('coverage.weekendsSubtitle')}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FEF2F2] text-[#EF4444] font-bold border border-[#FEE2E2]">
                      DEFAULT_WEEKEND
                    </span>
                  </div>

                  <div className="space-y-2">
                    {weekendReqs.map(req => (
                      <CoverageRequirementCard
                        key={req.id}
                        req={req}
                        isReadOnly={isReadOnly}
                        isEn={isEn}
                        shiftColor={getShiftColor(req.subFamily)}
                        onEdit={() => handleEditCoverage(req)}
                        onDuplicate={() => handleDuplicateCoverage(req)}
                        onDelete={() => setConfirmDialog({
                          type: 'DELETE_COVERAGE',
                          id: req.id,
                          title: t('coverage.deleteRequirement'),
                          message: `${t('coverage.deleteConfirm')} (${req.subFamily} - ${req.date})`
                        })}
                        onStepMin={(delta) => handleQuickMinChange(req.id, delta)}
                        onSetMin={(val) => handleSetMinDirect(req.id, val)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. SPECIFIC DATES REQUIREMENTS */}
              {(scopeFilter === 'ALL' || scopeFilter === 'SPECIFIC') && specificReqs.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3 lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                      <div>
                        <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider">
                          {t('coverage.specificDatesTitle')}
                        </h3>
                        <p className="text-[11px] text-[#64748B]">{t('coverage.specificDatesSubtitle')}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-bold border border-violet-200">
                      {specificReqs.length} {isEn ? 'custom dates' : 'dates ciblées'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {specificReqs.map(req => (
                      <CoverageRequirementCard
                        key={req.id}
                        req={req}
                        isReadOnly={isReadOnly}
                        isEn={isEn}
                        shiftColor={getShiftColor(req.subFamily)}
                        onEdit={() => handleEditCoverage(req)}
                        onDuplicate={() => handleDuplicateCoverage(req)}
                        onDelete={() => setConfirmDialog({
                          type: 'DELETE_COVERAGE',
                          id: req.id,
                          title: t('coverage.deleteRequirement'),
                          message: `${t('coverage.deleteConfirm')} (${req.subFamily} - ${req.date})`
                        })}
                        onStepMin={(delta) => handleQuickMinChange(req.id, delta)}
                        onSetMin={(val) => handleSetMinDirect(req.id, val)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ROTATION CYCLES */}
      {activeSubTab === 'ROTATION' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-[#1E293B]">
                {isEn ? 'Rotation Patterns & Cyclical Templates' : 'Modèles & Cycles de Rotation Récurrents'}
              </h3>
              <p className="text-[11px] text-[#64748B]">
                {isEn
                  ? 'Define recurring multi-day shift rotations for groups and teams'
                  : 'Définition des cycles plurijournaliers types pour l’alternance travail / repos'}
              </p>
            </div>

            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <button
                  id="rotation-btn-add"
                  onClick={handleOpenNewRotation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('coverage.newPattern')}</span>
                </button>

                <button
                  id="rotation-btn-reset"
                  onClick={() => {
                    setConfirmDialog({
                      type: 'RESET_ROTATION',
                      title: t('coverage.resetDefaults'),
                      message: isEn ? 'Restore default rotation patterns?' : 'Rétablir les modèles de rotation initiaux ?'
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] text-xs font-medium transition-colors"
                  title={t('coverage.resetDefaults')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEn ? 'Reset' : 'Réinitialiser'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Rotation Patterns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rotationPatterns.map(pattern => {
              const pName = isEn && ROTATION_PATTERNS_EN[pattern.id] ? ROTATION_PATTERNS_EN[pattern.id].name : pattern.name;
              const pDesc = isEn && ROTATION_PATTERNS_EN[pattern.id] ? ROTATION_PATTERNS_EN[pattern.id].description : pattern.description;

              return (
                <div
                  key={pattern.id}
                  className={`bg-white p-4 rounded-2xl border transition-all shadow-xs space-y-3.5 ${
                    pattern.isActive ? 'border-[#E2E8F0]' : 'border-slate-200 bg-slate-50/70 opacity-80'
                  }`}
                >
                  {/* Pattern Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] pb-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#1E293B]">{pName}</h4>
                        <button
                          disabled={isReadOnly}
                          onClick={() => handleToggleRotationActive(pattern.id)}
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                            pattern.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                          title={isReadOnly ? undefined : (isEn ? 'Click to toggle active state' : 'Cliquer pour basculer')}
                        >
                          {pattern.isActive ? t('coverage.active') : t('coverage.inactive')}
                        </button>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{pDesc}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#F1F5F9] text-[#1E293B] font-bold border border-[#E2E8F0] whitespace-nowrap">
                        {t('coverage.cycleDays', { count: pattern.cycleLength })}
                      </span>
                    </div>
                  </div>

                  {/* Visual Steps Matrix */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-[#64748B] flex items-center justify-between">
                      <span>{isEn ? 'Daily Sequence:' : 'Déroulé chronologique du cycle :'}</span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {pattern.steps.filter(s => !s.isRest).length} {isEn ? 'work' : 'travail'} • {pattern.steps.filter(s => s.isRest).length} {isEn ? 'rest' : 'repos'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {pattern.steps.map((step, idx) => {
                        const sColor = getShiftColor(step.suggestedShiftCode || step.requiredFamily || 'M');
                        return (
                          <div
                            key={idx}
                            className={`p-2 rounded-xl border text-center min-w-[54px] flex-1 max-w-[80px] transition-transform ${
                              step.isRest
                                ? 'bg-stone-100 border-stone-300 text-stone-700'
                                : `${sColor.bg} ${sColor.border} ${sColor.text}`
                            }`}
                          >
                            <div className="text-[9px] font-semibold opacity-70 uppercase tracking-tighter">
                              {t('coverage.dayStep', { day: step.dayIndex + 1 })}
                            </div>
                            <div className="text-xs font-black tracking-tight mt-0.5">
                              {step.isRest ? 'OFF' : (step.suggestedShiftCode || step.requiredFamily)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {!isReadOnly && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#E2E8F0]/70">
                      <button
                        onClick={() => handleEditRotation(pattern)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-[#3B82F6] hover:bg-[#EFF6FF] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Edit' : 'Modifier'}</span>
                      </button>

                      <button
                        onClick={() => handleDuplicateRotation(pattern)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                        title={isEn ? 'Duplicate' : 'Dupliquer'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Clone' : 'Dupliquer'}</span>
                      </button>

                      <button
                        onClick={() => setConfirmDialog({
                          type: 'DELETE_ROTATION',
                          id: pattern.id,
                          title: isEn ? 'Delete Rotation Pattern' : 'Supprimer le motif de rotation',
                          message: `${t('coverage.deletePatternConfirm')} (${pName})`
                        })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Delete' : 'Supprimer'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- MODAL 1: CREATE / EDIT COVERAGE REQUIREMENT --- */}
      {isCoverageModalOpen && editingCoverage && (
        <CoverageRequirementModal
          requirement={editingCoverage}
          availableShifts={availableShiftCodes}
          isEn={isEn}
          onClose={() => {
            setIsCoverageModalOpen(false);
            setEditingCoverage(null);
          }}
          onSave={handleSaveCoverage}
        />
      )}

      {/* --- MODAL 2: CREATE / EDIT ROTATION PATTERN --- */}
      {isRotationModalOpen && editingRotation && (
        <RotationPatternModal
          pattern={editingRotation}
          availableShifts={availableShiftCodes}
          isEn={isEn}
          onClose={() => {
            setIsRotationModalOpen(false);
            setEditingRotation(null);
          }}
          onSave={handleSaveRotation}
        />
      )}

      {/* --- CONFIRMATION DIALOG --- */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1E293B]">{confirmDialog.title}</h4>
                <p className="text-xs text-[#64748B] mt-0.5">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                {isEn ? 'Cancel' : 'Annuler'}
              </button>
              <button
                onClick={() => {
                  if (confirmDialog.type === 'DELETE_COVERAGE' && confirmDialog.id) {
                    handleDeleteCoverage(confirmDialog.id);
                  } else if (confirmDialog.type === 'DELETE_ROTATION' && confirmDialog.id) {
                    handleDeleteRotation(confirmDialog.id);
                  } else if (confirmDialog.type === 'RESET_COVERAGE') {
                    handleResetCoverage();
                  } else if (confirmDialog.type === 'RESET_ROTATION') {
                    handleResetRotations();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {isEn ? 'Confirm' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: CoverageRequirementCard
// =========================================================================
interface CoverageRequirementCardProps {
  req: CoverageRequirement;
  isReadOnly: boolean;
  isEn: boolean;
  shiftColor: { bg: string; text: string; border: string };
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStepMin: (delta: number) => void;
  onSetMin: (val: number) => void;
}

const CoverageRequirementCard: React.FC<CoverageRequirementCardProps> = ({
  req,
  isReadOnly,
  isEn,
  shiftColor,
  onEdit,
  onDuplicate,
  onDelete,
  onStepMin,
  onSetMin
}) => {
  const ruleId = getRuleForSubFamily(req.subFamily);
  const isDateSpecific = req.date !== 'DEFAULT_WEEKDAY' && req.date !== 'DEFAULT_WEEKEND';

  const priorityColor = 
    req.priority === 'HAUTE'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : req.priority === 'MOYENNE'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex flex-wrap items-center justify-between gap-2.5">
      {/* Left: Code, Priority, Target Date */}
      <div className="flex items-center gap-2.5">
        <span className={`px-2.5 py-1 rounded-lg font-black text-xs border shadow-2xs ${shiftColor.bg} ${shiftColor.text} ${shiftColor.border}`}>
          {req.subFamily}
        </span>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${priorityColor}`}>
              {req.priority}
            </span>
            <span className="text-[10px] font-mono text-[#64748B] font-semibold">
              {ruleId}
            </span>
          </div>

          {isDateSpecific && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-violet-700">
              <CalendarDays className="w-3 h-3" />
              <span>{req.date}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Minimum staffing control & action buttons */}
      <div className="flex items-center gap-3">
        {/* Stepper / Value */}
        <div className="flex items-center gap-1.5 bg-white border border-[#CBD5E1] rounded-xl px-1.5 py-1 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#64748B] px-1">
            {isEn ? 'Min:' : 'Min :'}
          </span>

          {!isReadOnly ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onStepMin(-1)}
                disabled={req.minimum <= 0}
                className="w-5 h-5 rounded flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 transition-colors"
                title="-1"
              >
                <Minus className="w-3 h-3" />
              </button>

              <input
                type="number"
                min="0"
                max="30"
                value={req.minimum}
                onChange={e => onSetMin(Number(e.target.value))}
                className="w-8 text-center font-black text-xs text-[#3B82F6] focus:outline-none"
              />

              <button
                onClick={() => onStepMin(1)}
                className="w-5 h-5 rounded flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                title="+1"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="font-black text-xs text-[#3B82F6] px-1">{req.minimum}</span>
          )}

          <span className="text-[10px] text-[#94A3B8] pr-1">{isEn ? 'agents' : 'ag.'}</span>
        </div>

        {/* Max indicator if defined */}
        {req.maximum !== undefined && (
          <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-1 rounded-lg border border-[#E2E8F0]">
            Max: {req.maximum}
          </span>
        )}

        {/* Action icons */}
        {!isReadOnly && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#3B82F6] hover:bg-white transition-colors"
              title={isEn ? 'Edit requirement' : 'Modifier'}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDuplicate}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition-colors"
              title={isEn ? 'Duplicate requirement' : 'Dupliquer'}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-white transition-colors"
              title={isEn ? 'Delete requirement' : 'Supprimer'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 1: CoverageRequirementModal
// =========================================================================
interface CoverageModalProps {
  requirement: CoverageRequirement;
  availableShifts: string[];
  isEn: boolean;
  onClose: () => void;
  onSave: (req: CoverageRequirement) => void;
}

const CoverageRequirementModal: React.FC<CoverageModalProps> = ({
  requirement,
  availableShifts,
  isEn,
  onClose,
  onSave
}) => {
  const [subFamily, setSubFamily] = useState(requirement.subFamily);
  const [scopeType, setScopeType] = useState<'WEEKDAY' | 'WEEKEND' | 'SPECIFIC'>(() => {
    if (requirement.date === 'DEFAULT_WEEKDAY') return 'WEEKDAY';
    if (requirement.date === 'DEFAULT_WEEKEND') return 'WEEKEND';
    return 'SPECIFIC';
  });
  const [specificDate, setSpecificDate] = useState(() => {
    if (requirement.date !== 'DEFAULT_WEEKDAY' && requirement.date !== 'DEFAULT_WEEKEND') {
      return requirement.date;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [minimum, setMinimum] = useState(requirement.minimum);
  const [maximum, setMaximum] = useState<number | ''>(requirement.maximum ?? '');
  const [priority, setPriority] = useState<'HAUTE' | 'MOYENNE' | 'BASSE'>(requirement.priority);
  const [error, setError] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFamily.trim()) {
      setError(isEn ? 'Sub-family / shift code is required.' : 'Le code de sous-famille est requis.');
      return;
    }
    if (minimum < 0) {
      setError(isEn ? 'Minimum must be a positive number.' : 'Le minimum doit être un entier positif.');
      return;
    }
    if (maximum !== '' && maximum < minimum) {
      setError(isEn ? 'Maximum cannot be less than minimum.' : 'Le maximum ne peut pas être inférieur au minimum.');
      return;
    }

    const finalDate =
      scopeType === 'WEEKDAY'
        ? 'DEFAULT_WEEKDAY'
        : scopeType === 'WEEKEND'
        ? 'DEFAULT_WEEKEND'
        : specificDate;

    onSave({
      ...requirement,
      subFamily: subFamily.trim().toUpperCase(),
      date: finalDate,
      minimum: Number(minimum),
      maximum: maximum === '' ? undefined : Number(maximum),
      priority
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl p-5 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1E293B]">
                {requirement.id.startsWith('cov-') && requirement.subFamily
                  ? (isEn ? `Configure Requirement: ${requirement.subFamily}` : `Exigence de Couverture : ${requirement.subFamily}`)
                  : (isEn ? 'Add Coverage Requirement' : 'Ajouter une exigence')}
              </h3>
              <p className="text-[11px] text-[#64748B]">
                {isEn ? 'Define target staffing rules by day or shift' : 'Paramétrage des effectifs cibles par plage'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#EF4444] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
          {/* 1. Scope / Date Type */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#1E293B] block">
              {isEn ? 'Scope / Application Window' : 'Portée d’application'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setScopeType('WEEKDAY')}
                className={`p-2 rounded-xl border text-center transition-all font-semibold ${
                  scopeType === 'WEEKDAY'
                    ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6] ring-2 ring-[#3B82F6]/20'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white'
                }`}
              >
                <div>{isEn ? 'Weekdays' : 'Semaine'}</div>
                <div className="text-[9px] text-[#94A3B8] font-normal">Lun – Ven</div>
              </button>

              <button
                type="button"
                onClick={() => setScopeType('WEEKEND')}
                className={`p-2 rounded-xl border text-center transition-all font-semibold ${
                  scopeType === 'WEEKEND'
                    ? 'bg-[#FEF2F2] border-[#EF4444] text-[#EF4444] ring-2 ring-[#EF4444]/20'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white'
                }`}
              >
                <div>{isEn ? 'Weekend' : 'Week-end'}</div>
                <div className="text-[9px] text-[#94A3B8] font-normal">Sam & Dim</div>
              </button>

              <button
                type="button"
                onClick={() => setScopeType('SPECIFIC')}
                className={`p-2 rounded-xl border text-center transition-all font-semibold ${
                  scopeType === 'SPECIFIC'
                    ? 'bg-violet-50 border-violet-600 text-violet-700 ring-2 ring-violet-600/20'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white'
                }`}
              >
                <div>{isEn ? 'Specific Date' : 'Date ciblée'}</div>
                <div className="text-[9px] text-[#94A3B8] font-normal">YYYY-MM-DD</div>
              </button>
            </div>

            {scopeType === 'SPECIFIC' && (
              <div className="pt-1">
                <input
                  type="date"
                  value={specificDate}
                  onChange={e => setSpecificDate(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  required
                />
              </div>
            )}
          </div>

          {/* 2. Sub-Family / Shift Code */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#1E293B] block">
              {isEn ? 'Sub-Family or Shift Code' : 'Sous-famille / Code Shift cible'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subFamily}
                onChange={e => setSubFamily(e.target.value.toUpperCase())}
                placeholder="Ex: M1, M2, S1, S3, N..."
                className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                required
              />
            </div>
            {/* Quick selector chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-[#94A3B8]">{isEn ? 'Suggestions:' : 'Suggestions :'}</span>
              {COMMON_SUBFAMILIES.map(sf => (
                <button
                  key={sf}
                  type="button"
                  onClick={() => setSubFamily(sf)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                    subFamily === sf
                      ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:border-[#3B82F6]'
                  }`}
                >
                  {sf}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Minimum and Maximum Staffing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-[#1E293B] block">
                {isEn ? 'Minimum Staffing' : 'Effectif minimum requis'}
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={minimum}
                onChange={e => setMinimum(Number(e.target.value))}
                className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                required
              />
              <span className="text-[10px] text-[#94A3B8]">{isEn ? 'Agents required' : 'Agents minimums'}</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1E293B] block">
                {isEn ? 'Maximum (Optional)' : 'Plafond max (optionnel)'}
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={maximum}
                onChange={e => setMaximum(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={isEn ? 'None' : 'Aucun'}
                className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
              <span className="text-[10px] text-[#94A3B8]">{isEn ? 'Upper limit' : 'Limite haute'}</span>
            </div>
          </div>

          {/* 4. Priority Level */}
          <div className="space-y-1.5">
            <label className="font-bold text-[#1E293B] block">
              {isEn ? 'Priority Level' : 'Niveau de priorité'}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setPriority('HAUTE')}
                className={`p-2 rounded-xl border text-center transition-all font-semibold ${
                  priority === 'HAUTE'
                    ? 'bg-[#FEF2F2] border-[#EF4444] text-[#EF4444] ring-2 ring-[#EF4444]/20'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white'
                }`}
              >
                <div>{isEn ? 'High' : 'Haute'}</div>
                <div className="text-[9px] text-[#94A3B8] font-normal">{isEn ? 'Blocking' : 'Bloquant'}</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('MOYENNE')}
                className={`p-2 rounded-xl border text-center transition-all font-semibold ${
                  priority === 'MOYENNE'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white'
                }`}
              >
                <div>{isEn ? 'Medium' : 'Moyenne'}</div>
                <div className="text-[9px] text-[#94A3B8] font-normal">{isEn ? 'Standard' : 'Standard'}</div>
              </button>

              <button
                type="button"
                onClick={() => setPriority('BASSE')}
                className={`p-2 rounded-xl border text-center transition-all font-semibold ${
                  priority === 'BASSE'
                    ? 'bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6] ring-2 ring-[#3B82F6]/20'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white'
                }`}
              >
                <div>{isEn ? 'Low' : 'Basse'}</div>
                <div className="text-[9px] text-[#94A3B8] font-normal">{isEn ? 'Optimize' : 'Optimisation'}</div>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
            >
              {isEn ? 'Cancel' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {isEn ? 'Save Requirement' : 'Enregistrer l’exigence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 2: RotationPatternModal
// =========================================================================
interface RotationModalProps {
  pattern: RotationPattern;
  availableShifts: string[];
  isEn: boolean;
  onClose: () => void;
  onSave: (pattern: RotationPattern) => void;
}

const RotationPatternModal: React.FC<RotationModalProps> = ({
  pattern,
  availableShifts,
  isEn,
  onClose,
  onSave
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(pattern.name);
  const [description, setDescription] = useState(pattern.description);
  const [cycleLength, setCycleLength] = useState(pattern.cycleLength);
  const [isActive, setIsActive] = useState(pattern.isActive);
  const [steps, setSteps] = useState(() => {
    return pattern.steps.map(s => ({ ...s }));
  });
  const [error, setError] = useState('');

  // Handle cycle length adjustments dynamically
  const handleCycleLengthChange = (newLen: number) => {
    const validLen = Math.max(2, Math.min(28, newLen));
    setCycleLength(validLen);

    setSteps(prev => {
      if (validLen === prev.length) return prev;
      if (validLen < prev.length) {
        return prev.slice(0, validLen);
      }
      // Expand steps
      const updated = [...prev];
      for (let i = prev.length; i < validLen; i++) {
        updated.push({
          dayIndex: i,
          requiredFamily: 'OFF',
          suggestedShiftCode: 'OFF',
          isRest: true
        });
      }
      return updated;
    });
  };

  const handleToggleStepRest = (dayIndex: number) => {
    setSteps(prev =>
      prev.map(step => {
        if (step.dayIndex === dayIndex) {
          const nextIsRest = !step.isRest;
          return {
            ...step,
            isRest: nextIsRest,
            requiredFamily: nextIsRest ? 'OFF' : 'M',
            suggestedShiftCode: nextIsRest ? 'OFF' : 'M1'
          };
        }
        return step;
      })
    );
  };

  const handleStepShiftChange = (dayIndex: number, shiftCode: string) => {
    let family: ShiftFamily = 'M';
    if (shiftCode.startsWith('S')) family = 'S';
    else if (shiftCode === 'N') family = 'N';
    else if (shiftCode === 'J') family = 'J';
    else if (shiftCode === 'T') family = 'T';
    else if (shiftCode === 'OFF') family = 'REPOS';

    setSteps(prev =>
      prev.map(step => {
        if (step.dayIndex === dayIndex) {
          const isRest = shiftCode === 'OFF';
          return {
            ...step,
            isRest,
            suggestedShiftCode: shiftCode,
            requiredFamily: isRest ? 'OFF' : family
          };
        }
        return step;
      })
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isEn ? 'Pattern name is required.' : 'Le nom du motif est requis.');
      return;
    }

    onSave({
      ...pattern,
      name: name.trim(),
      description: description.trim(),
      cycleLength,
      isActive,
      steps: steps.map((s, idx) => ({ ...s, dayIndex: idx }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl p-5 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1E293B]">
                {pattern.name ? (isEn ? `Edit Pattern: ${pattern.name}` : `Modifier le Motif : ${pattern.name}`) : (isEn ? 'New Rotation Pattern' : 'Nouveau motif de rotation')}
              </h3>
              <p className="text-[11px] text-[#64748B]">
                {isEn ? 'Configure multi-day repeating sequence' : 'Configuration de la séquence cyclique'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2] text-xs text-[#EF4444] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
          {/* Name & Active status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-[#1E293B] block">
                {isEn ? 'Pattern Name' : 'Nom du motif / cycle'}
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Cycle 2M / 2S / 2OFF"
                className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-[#1E293B] block">
                {isEn ? 'Cycle Length' : 'Longueur (jours)'}
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCycleLengthChange(cycleLength - 1)}
                  className="w-8 h-8 rounded-lg border border-[#CBD5E1] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="2"
                  max="28"
                  value={cycleLength}
                  onChange={e => handleCycleLengthChange(Number(e.target.value))}
                  className="w-12 p-1.5 text-center font-bold text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleCycleLengthChange(cycleLength + 1)}
                  className="w-8 h-8 rounded-lg border border-[#CBD5E1] bg-white flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-[#1E293B] block">
              {isEn ? 'Functional Description' : 'Description fonctionnelle'}
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Alternance 2 matins, 2 soirs, 2 repos consécutifs"
              className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pattern-is-active"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#3B82F6] focus:ring-[#3B82F6]"
            />
            <label htmlFor="pattern-is-active" className="text-xs font-semibold text-[#1E293B] cursor-pointer">
              {isEn ? 'Active pattern in planning assistant' : 'Activer ce motif dans les suggestions du planificateur'}
            </label>
          </div>

          {/* Day-by-day Steps Matrix */}
          <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#1E293B] block">
                {isEn ? 'Day-by-Day Sequence Definition' : 'Définition jour par jour du cycle'}
              </label>
              <span className="text-[10px] text-[#94A3B8]">
                {cycleLength} {isEn ? 'days total' : 'jours au total'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
              {steps.map(step => (
                <div
                  key={step.dayIndex}
                  className={`p-2.5 rounded-xl border transition-all text-center space-y-1.5 ${
                    step.isRest
                      ? 'bg-stone-50 border-stone-200'
                      : 'bg-indigo-50/70 border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#64748B] uppercase">
                      {t('coverage.dayStep', { day: step.dayIndex + 1 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStepRest(step.dayIndex)}
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        step.isRest
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-indigo-200 text-indigo-800'
                      }`}
                    >
                      {step.isRest ? 'OFF' : 'SHIFT'}
                    </button>
                  </div>

                  {!step.isRest ? (
                    <select
                      value={step.suggestedShiftCode || 'M1'}
                      onChange={e => handleStepShiftChange(step.dayIndex, e.target.value)}
                      className="w-full p-1 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 focus:outline-none"
                    >
                      {COMMON_SUBFAMILIES.map(code => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs font-bold text-stone-500 py-1">
                      {isEn ? 'Rest Day' : 'Repos'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
            >
              {isEn ? 'Cancel' : 'Annuler'}
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {isEn ? 'Save Pattern' : 'Enregistrer le motif'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
