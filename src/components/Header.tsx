/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  BarChart3,
  Users,
  Clock,
  Sliders,
  ShieldCheck,
  Zap,
  History,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Lock,
  RotateCcw,
  Search,
  Globe,
  Cloud,
  RefreshCw,
  Database,
  LogIn,
  LogOut
} from 'lucide-react';
import { UserRole, PlanningVersion } from '../types/planning';

export interface HeaderProps {
  activeTab?: string;
  currentTab?: string;
  onTabChange?: (tab: any) => void;
  setCurrentTab?: (tab: any) => void;
  userRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  setUserRole?: (role: UserRole) => void;
  currentVersion: PlanningVersion;
  versions?: PlanningVersion[];
  onSelectVersion?: (id: string) => void;
  validationScore: number;
  issuesCount?: number;
  hardViolationsCount?: number;
  warningsCount?: number;
  onOpenGenerator?: () => void;
  onOpenValidation: () => void;
  onOpenTests?: () => void;
  onOpenTestsRunner?: () => void;
  onOpenVersions?: () => void;
  onOpenVersionsModal?: () => void;
  onOpenImportExport: () => void;
  onOpenAudit?: () => void;
  onOpenAuditModal?: () => void;
  onResetData?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  cloudSyncStatus?: 'CONNECTED' | 'SYNCING' | 'ERROR' | 'OFFLINE';
  lastCloudSync?: string;
  onTriggerCloudSync?: () => void;
  authUser?: { email: string | null; displayName: string | null; photoURL: string | null } | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentTab,
  onTabChange,
  setCurrentTab,
  userRole,
  onRoleChange,
  setUserRole,
  currentVersion,
  validationScore,
  hardViolationsCount = 0,
  warningsCount = 0,
  onOpenGenerator,
  onOpenValidation,
  onOpenTests,
  onOpenTestsRunner,
  onOpenVersions,
  onOpenVersionsModal,
  onOpenImportExport,
  onOpenAudit,
  onOpenAuditModal,
  onResetData,
  searchQuery,
  onSearchChange,
  cloudSyncStatus = 'CONNECTED',
  lastCloudSync,
  onTriggerCloudSync,
  authUser,
  onLogin,
  onLogout
}) => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith('en');

  const [localSearch, setLocalSearch] = useState('');
  const isPublished = currentVersion?.status === 'PUBLISHED';

  // Normalize tab
  const current = (activeTab || currentTab || 'PLANNING').toUpperCase();
  const setTab = (tab: string) => {
    if (onTabChange) onTabChange(tab);
    if (setCurrentTab) setCurrentTab(tab.toLowerCase());
  };

  const changeRole = (role: UserRole) => {
    if (onRoleChange) onRoleChange(role);
    if (setUserRole) setUserRole(role);
  };

  const handleOpenVersions = () => {
    if (onOpenVersionsModal) onOpenVersionsModal();
    else if (onOpenVersions) onOpenVersions();
  };

  const handleOpenAudit = () => {
    if (onOpenAuditModal) onOpenAuditModal();
    else if (onOpenAudit) onOpenAudit();
  };

  const handleOpenTests = () => {
    if (onOpenTestsRunner) onOpenTestsRunner();
    else if (onOpenTests) onOpenTests();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (onSearchChange) onSearchChange(val);
  };

  const userInitials = userRole === 'ADMIN' ? 'AD' : userRole === 'PLANNER' ? 'PL' : 'VI';
  const userName = userRole === 'ADMIN'
    ? (isEn ? 'HR Administrator' : 'Administrateur RH')
    : userRole === 'PLANNER'
    ? (isEn ? 'Lead Planner' : 'Planificateur Chef')
    : (isEn ? 'Guest Viewer' : 'Lecteur Invité');

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
      {/* Top Primary Bar */}
      <div className="w-full px-2 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Version Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center text-white shadow-xs">
            <div className="w-4 h-4 border-2 border-white rounded-xs"></div>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#1E293B]">NovaSched - smart Planning</h1>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                v{currentVersion?.versionNumber || 1} • {currentVersion?.name || (isEn ? 'Standard Cycle' : 'Cycle Standard')}
              </span>
              {isPublished ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-[#ECFDF5] text-[#10B981] border border-[#A7F3D0]">
                  <Lock className="w-3 h-3" /> {isEn ? 'Locked' : 'Verrouillée'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-[#EFF6FF] text-[#3B82F6] border border-[#BFDBFE]">
                  {isEn ? 'Active Draft' : 'Brouillon Actif'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder={isEn ? 'Search collaborator, rule...' : 'Rechercher collaborateur, règle...'}
            value={searchQuery !== undefined ? searchQuery : localSearch}
            onChange={handleSearch}
            className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-full py-1.5 pl-10 pr-4 text-xs w-60 lg:w-72 text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] transition-all"
          />
          <div className="absolute left-3 top-2 text-[#94A3B8]">
            <Search className="w-4 h-4" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Validation Score Pill */}
          <button
            id="header-validation-btn"
            onClick={onOpenValidation}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              hardViolationsCount > 0
                ? 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA] hover:bg-[#FEE2E2]'
                : warningsCount > 0
                ? 'bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A] hover:bg-[#FEF3C7]'
                : 'bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0] hover:bg-[#D1FAE5]'
            }`}
            title={isEn ? 'Inspect constraint analysis report' : "Consulter le rapport d'analyse des contraintes"}
          >
            {hardViolationsCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            )}
            <span>{isEn ? 'Compliance' : 'Conformité'} : {validationScore}%</span>
            {hardViolationsCount > 0 && (
              <span className="bg-[#EF4444] text-white rounded-full px-1.5 py-0.2 text-[10px]">
                {hardViolationsCount}
              </span>
            )}
            {warningsCount > 0 && hardViolationsCount === 0 && (
              <span className="bg-[#F59E0B] text-white rounded-full px-1.5 py-0.2 text-[10px]">
                {warningsCount}
              </span>
            )}
          </button>

          {/* Generator Modal Action */}
          {userRole !== 'VIEWER' && onOpenGenerator && (
            <button
              id="header-generator-btn"
              onClick={onOpenGenerator}
              disabled={isPublished}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors ${
                isPublished
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('header.generate')}</span>
            </button>
          )}

          {/* Quick Tools Icons */}
          <div className="flex items-center gap-1">
            <button
              id="header-versions-btn"
              onClick={handleOpenVersions}
              className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] rounded-lg transition-colors"
              title={isEn ? 'Version management & Comparison' : 'Gestion des versions & Différentiel'}
            >
              <History className="w-4 h-4" />
            </button>

            <button
              id="header-tests-btn"
              onClick={handleOpenTests}
              className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] rounded-lg transition-colors"
              title={isEn ? 'Business test suite (14 mandatory tests)' : 'Suite de tests métier (14 tests obligatoires)'}
            >
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              id="header-export-btn"
              onClick={onOpenImportExport}
              className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] rounded-lg transition-colors"
              title={isEn ? 'Export Excel / PDF / CSV & Import' : 'Export Excel / PDF / CSV & Import'}
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            <button
              id="header-audit-btn"
              onClick={handleOpenAudit}
              className="p-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] rounded-lg transition-colors"
              title={isEn ? 'Audit trail' : "Journal d'audit"}
            >
              <FileText className="w-4 h-4" />
            </button>

            {onResetData && (
              <button
                onClick={() => {
                  const confirmMsg = isEn 
                    ? 'Reset all data to baseline default values?' 
                    : 'Réinitialiser toutes les données aux valeurs de référence initiales ?';
                  if (window.confirm(confirmMsg)) {
                    onResetData();
                  }
                }}
                className="p-2 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                title={isEn ? 'Reset demo data' : "Réinitialiser données d'exemple"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Firestore Cloud Sync Status Button */}
          {onTriggerCloudSync && (
            <button
              id="header-cloud-sync-btn"
              onClick={onTriggerCloudSync}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                cloudSyncStatus === 'SYNCING'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                  : cloudSyncStatus === 'ERROR'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
              title={
                lastCloudSync
                  ? `Firestore Cloud: ${lastCloudSync}. Cliquez pour synchroniser.`
                  : 'Persistance Firestore Cloud active. Cliquez pour synchroniser.'
              }
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">
                {cloudSyncStatus === 'SYNCING'
                  ? (isEn ? 'Syncing...' : 'Synchro...')
                  : cloudSyncStatus === 'ERROR'
                  ? (isEn ? 'Cloud Error' : 'Erreur Cloud')
                  : 'Firestore Cloud'}
              </span>
              <span className={`w-2 h-2 rounded-full ${cloudSyncStatus === 'CONNECTED' ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-amber-400'}`}></span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex items-center gap-1 pl-2 border-l border-[#E2E8F0]">
            <Globe className="w-4 h-4 text-[#64748B]" />
            <select
              value={i18n.language.startsWith('en') ? 'en' : 'fr'}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2 py-1 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
            </select>
          </div>

          {/* Google Auth & User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
            {authUser ? (
              <div className="flex items-center gap-1.5">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full border border-[#CBD5E1]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                    {authUser.email?.substring(0, 2).toUpperCase() || userInitials}
                  </div>
                )}
                <div className="hidden 2xl:flex flex-col text-left">
                  <span className="text-[11px] font-medium text-[#1E293B] max-w-[120px] truncate" title={authUser.email || ''}>
                    {authUser.displayName || authUser.email}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold">Connecté Cloud</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title={isEn ? 'Sign out' : 'Se déconnecter'}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onLogin && (
                <button
                  id="header-login-btn"
                  onClick={onLogin}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1] transition-colors"
                  title={isEn ? 'Sign in with Google' : 'Se connecter avec Google'}
                >
                  <LogIn className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span className="hidden sm:inline">Google</span>
                </button>
              )
            )}

            {!authUser && (
              <div className="w-8 h-8 rounded-full bg-[#E2E8F0] flex items-center justify-center text-xs font-semibold text-[#1E293B]">
                {userInitials}
              </div>
            )}
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#1E293B] leading-tight">{userName}</span>
              <span className="text-[10px] text-[#64748B] leading-tight">{userRole}</span>
            </div>
            <select
              id="header-role-select"
              value={userRole}
              onChange={e => changeRole(e.target.value as UserRole)}
              className="text-xs font-semibold bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2 py-1 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            >
              <option value="ADMIN">Admin</option>
              <option value="PLANNER">Planner</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Subbar with Theme Tabs */}
      <div className="bg-white border-t border-[#E2E8F0]">
        <div className="w-full px-2 sm:px-4 md:px-6 flex items-center gap-1 overflow-x-auto py-1.5 text-xs">
          <button
            id="tab-planning"
            onClick={() => setTab('PLANNING')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap ${
              current === 'PLANNING'
                ? 'bg-[#F1F5F9] text-[#3B82F6] font-semibold'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('nav.planning')}</span>
          </button>

          <button
            id="tab-dashboard"
            onClick={() => setTab('DASHBOARD')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap ${
              current === 'DASHBOARD'
                ? 'bg-[#F1F5F9] text-[#3B82F6] font-semibold'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('nav.dashboard')}</span>
          </button>

          <button
            id="tab-employees"
            onClick={() => setTab('EMPLOYEES')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap ${
              current === 'EMPLOYEES'
                ? 'bg-[#F1F5F9] text-[#3B82F6] font-semibold'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('nav.employees')}</span>
          </button>

          <button
            id="tab-shifts"
            onClick={() => setTab('SHIFTS')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap ${
              current === 'SHIFTS'
                ? 'bg-[#F1F5F9] text-[#3B82F6] font-semibold'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t('nav.shifts')}</span>
          </button>

          <button
            id="tab-rules"
            onClick={() => setTab('RULES')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap ${
              current === 'RULES'
                ? 'bg-[#F1F5F9] text-[#3B82F6] font-semibold'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t('nav.rules')}</span>
          </button>

          <button
            id="tab-coverage"
            onClick={() => setTab('COVERAGE')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors whitespace-nowrap ${
              current === 'COVERAGE'
                ? 'bg-[#F1F5F9] text-[#3B82F6] font-semibold'
                : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('nav.coverage')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
