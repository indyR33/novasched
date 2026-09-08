/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  UserRole,
  PlanningVersion,
  Employee,
  Shift,
  Qualification,
  CoverageRequirement,
  RotationPattern,
  RuleDefinition,
  PayPeriod,
  Assignment,
  QualificationStatus
} from './types/planning';
import { StorageService } from './services/storage';
import { FirestoreService } from './services/firestoreService';
import { auth, loginWithGoogle, logoutFirebase, testFirestoreConnection } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { RulesEngine } from './engine/rulesEngine';

import { Header } from './components/Header';
import { PlanningGrid } from './components/PlanningGrid';
import { DashboardView } from './components/DashboardView';
import { EmployeeManager } from './components/EmployeeManager';
import { ShiftManager } from './components/ShiftManager';
import { RulesManager } from './components/RulesManager';
import { CoverageManager } from './components/CoverageManager';
import { AssignmentModal } from './components/AssignmentModal';
import { GeneratorModal } from './components/GeneratorModal';
import { ValidationDrawer } from './components/ValidationDrawer';
import { VersionsModal } from './components/VersionsModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { ImportExportModal } from './components/ImportExportModal';
import { TestsRunnerModal } from './components/TestsRunnerModal';

export default function App() {
  // 1. Roles, Auth and Navigation
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'CONNECTED' | 'SYNCING' | 'ERROR' | 'OFFLINE'>('CONNECTED');
  const [lastCloudSync, setLastCloudSync] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PLANNING' | 'DASHBOARD' | 'EMPLOYEES' | 'SHIFTS' | 'RULES' | 'COVERAGE'>('PLANNING');

  // 2. Core domain state from StorageService
  const [versions, setVersions] = useState<PlanningVersion[]>(() => StorageService.getVersions());
  const [currentVersionId, setCurrentVersionId] = useState<string>(() => StorageService.getActiveVersionId());
  const [employees, setEmployees] = useState<Employee[]>(() => StorageService.getEmployees());
  const [shifts, setShifts] = useState<Shift[]>(() => StorageService.getShifts());
  const [qualifications, setQualifications] = useState<Qualification[]>(() => StorageService.getQualifications());
  const [coverageRequirements, setCoverageRequirements] = useState<CoverageRequirement[]>(() => StorageService.getCoverageRequirements());
  const [rotationPatterns, setRotationPatterns] = useState<RotationPattern[]>(() => StorageService.getRotationPatterns());
  const [rules, setRules] = useState<RuleDefinition[]>(() => StorageService.getRules());
  const [payPeriods] = useState<PayPeriod[]>(() => StorageService.getPayPeriods());

  // Current active version
  const currentVersion = useMemo(() => {
    return versions.find(v => v.id === currentVersionId) || versions[0];
  }, [versions, currentVersionId]);

  // 3. Modals & Drawers state
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);

  // Cell editing state
  const [editingCell, setEditingCell] = useState<{
    employeeId: string;
    date: string;
  } | null>(null);

  // 4. Real-time Autonomous Rules Engine Evaluation
  const evaluation = useMemo(() => {
    if (!currentVersion) {
      return {
        issues: [],
        score: 100,
        statsByEmployee: {},
        dailyCoverage: {},
        totalCountedHours: 0
      };
    }

    return RulesEngine.evaluate({
      version: currentVersion,
      employees,
      shifts,
      qualifications,
      rules,
      coverageRequirements,
      rotationPatterns
    });
  }, [currentVersion, employees, shifts, qualifications, rules, coverageRequirements, rotationPatterns]);

  // Keep version validationScore synchronized in state and storage
  useEffect(() => {
    if (currentVersion && currentVersion.validationScore !== evaluation.score) {
      const updated = versions.map(v => {
        if (v.id === currentVersion.id) {
          return { ...v, validationScore: evaluation.score };
        }
        return v;
      });
      setVersions(updated);
      StorageService.saveVersions(updated);
    }
  }, [evaluation.score, currentVersion?.id]);

  // Bootstrap Firestore connection test and initial data hydration
  useEffect(() => {
    // 1. Connection test as required by SKILL.md
    testFirestoreConnection();

    // 2. Auth listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user?.email?.toLowerCase() === 'richard.digonal@gmail.com') {
        setUserRole('ADMIN');
      }
      if (user) {
        try {
          const cloudData = await FirestoreService.fetchAllFromFirestore();
          if (!cloudData.versions || cloudData.versions.length === 0) {
            await FirestoreService.syncAllToFirestore({
              versions: StorageService.getVersions(),
              employees: StorageService.getEmployees(),
              shifts: StorageService.getShifts(),
              qualifications: StorageService.getQualifications(),
              coverageRequirements: StorageService.getCoverageRequirements(),
              rotationPatterns: StorageService.getRotationPatterns(),
              rules: StorageService.getRules(),
              payPeriods: StorageService.getPayPeriods(),
              activeVersionId: StorageService.getActiveVersionId()
            });
          }
          setLastCloudSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setCloudSyncStatus('CONNECTED');
        } catch (err) {
          console.warn('Post-login cloud sync notice:', err);
        }
      }
    });

    // 3. Hydrate from Firestore or Seed initial data
    const initCloud = async () => {
      setCloudSyncStatus('SYNCING');
      try {
        const cloudData = await FirestoreService.fetchAllFromFirestore();
        if (cloudData.versions && cloudData.versions.length > 0) {
          setVersions(cloudData.versions);
          if (cloudData.activeVersionId) setCurrentVersionId(cloudData.activeVersionId);
          if (cloudData.employees && cloudData.employees.length > 0) setEmployees(cloudData.employees);
          if (cloudData.shifts && cloudData.shifts.length > 0) setShifts(cloudData.shifts);
          if (cloudData.qualifications && cloudData.qualifications.length > 0) setQualifications(cloudData.qualifications);
          if (cloudData.coverage && cloudData.coverage.length > 0) setCoverageRequirements(cloudData.coverage);
          if (cloudData.rotations && cloudData.rotations.length > 0) setRotationPatterns(cloudData.rotations);
          if (cloudData.rules && cloudData.rules.length > 0) setRules(cloudData.rules);
          setLastCloudSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setCloudSyncStatus('CONNECTED');
        } else if (auth.currentUser) {
          // Empty remote database - Seed initial planning versions and settings to Firestore if signed in
          await FirestoreService.syncAllToFirestore({
            versions: StorageService.getVersions(),
            employees: StorageService.getEmployees(),
            shifts: StorageService.getShifts(),
            qualifications: StorageService.getQualifications(),
            coverageRequirements: StorageService.getCoverageRequirements(),
            rotationPatterns: StorageService.getRotationPatterns(),
            rules: StorageService.getRules(),
            payPeriods: StorageService.getPayPeriods(),
            activeVersionId: StorageService.getActiveVersionId()
          });
          setLastCloudSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setCloudSyncStatus('CONNECTED');
        } else {
          setCloudSyncStatus('CONNECTED');
        }
      } catch (err) {
        console.warn('Firestore initial sync notice:', err);
        setCloudSyncStatus('CONNECTED');
      }
    };

    initCloud();

    // 4. Real-time subscription to planning versions
    const unsubscribeVersions = FirestoreService.subscribeVersions(
      (remoteVersions) => {
        if (remoteVersions && remoteVersions.length > 0) {
          setVersions(remoteVersions);
          setLastCloudSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      },
      (err) => {
        console.warn('Firestore versions listener notice:', err);
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeVersions();
    };
  }, []);

  const handleTriggerCloudSync = useCallback(async () => {
    if (!auth.currentUser) {
      try {
        await loginWithGoogle();
      } catch (err) {
        console.warn('Google sign-in required for cloud sync:', err);
      }
      return;
    }
    setCloudSyncStatus('SYNCING');
    try {
      await FirestoreService.syncAllToFirestore({
        versions,
        employees,
        shifts,
        qualifications,
        coverageRequirements,
        rotationPatterns,
        rules,
        payPeriods,
        activeVersionId: currentVersionId
      });
      setLastCloudSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCloudSyncStatus('CONNECTED');
    } catch (err) {
      console.error('Manual Firestore sync error:', err);
      setCloudSyncStatus('ERROR');
      setTimeout(() => setCloudSyncStatus('CONNECTED'), 4000);
    }
  }, [versions, employees, shifts, qualifications, coverageRequirements, rotationPatterns, rules, payPeriods, currentVersionId]);

  const handleLogin = useCallback(async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutFirebase();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }, []);

  // 5. Handlers for Assignments
  const handleSelectCell = useCallback((employeeOrId: Employee | string, date: string) => {
    const employeeId = typeof employeeOrId === 'string' ? employeeOrId : employeeOrId?.id;
    if (!employeeId) return;

    if (currentVersion.status === 'PUBLISHED' && userRole !== 'ADMIN') {
      // Viewer or Planner cannot edit locked version (R35)
      alert('Cette version est publiée et verrouillée en lecture seule (R35).');
      return;
    }
    if (userRole === 'VIEWER') {
      return;
    }
    setEditingCell({ employeeId, date });
  }, [currentVersion.status, userRole]);

  
  const handleQuickAssign = useCallback((employeeOrId: Employee | string, date: string, shiftCode: string) => {
    if (!currentVersion) return;
    if (currentVersion.status === 'PUBLISHED' && userRole !== 'ADMIN') return;
    if (userRole === 'VIEWER') return;

    const employeeId = typeof employeeOrId === 'string' ? employeeOrId : employeeOrId?.id;
    if (!employeeId) return;

    const emp = employees.find(e => e.id === employeeId);
    const shift = shifts.find(s => s.code === shiftCode);
    if (!emp || !shift) return;

    // Check Authorization
    let isAuthorized = true;
    if (emp.arrivalDate && date < emp.arrivalDate) {
      isAuthorized = false;
    } else if (emp.departureDate && date > emp.departureDate) {
      isAuthorized = false;
    } else if (shift.type === 'travail') {
      const qual = qualifications.find(
        q => q.employeeId === employeeId && q.shiftCode === shift.code
      );
      if (!qual || qual.status === 'NOT_AUTHORIZED') {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      // For quick assign, if not authorized, we fallback to modal to prompt override reason
      setEditingCell({ employeeId, date });
      return;
    }

    const existingIndex = (currentVersion.assignments || []).findIndex(a => a.employeeId === employeeId && a.date === date);
    
    // Build Assignment
    const newAssignment = {
      id: `asg-${employeeId}-${date}`,
      employeeId,
      date,
      shiftCode,
      countedHours: shift?.countedHours || 0,
      isOverride: false,
      source: 'manual'
    };

    let updatedAssignments = [...(currentVersion.assignments || [])];
    if (existingIndex >= 0) {
      if (shiftCode === 'OFF') {
        updatedAssignments.splice(existingIndex, 1);
      } else {
        updatedAssignments[existingIndex] = newAssignment;
      }
    } else if (shiftCode !== 'OFF') {
      updatedAssignments.push(newAssignment);
    }

    const updatedVersion = {
      ...currentVersion,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString()
    };

    const updatedVersions = versions.map(v => (v.id === currentVersion.id ? updatedVersion : v));
    setVersions(updatedVersions);
    StorageService.saveVersions(updatedVersions);
  }, [currentVersion, userRole, employees, shifts, qualifications, versions]);


  const handleSaveAssignment = useCallback((shiftCode: string, isOverride: boolean, overrideReason: string, comment: string) => {
    if (!editingCell || !currentVersion) return;

    const { employeeId, date } = editingCell;
    const shift = shifts.find(s => s.code === shiftCode);
    const existingIndex = (currentVersion.assignments || []).findIndex(a => a.employeeId === employeeId && a.date === date);
    const oldCode = existingIndex >= 0 ? (currentVersion.assignments || [])[existingIndex].shiftCode : 'OFF';

    const newAssignment: Assignment = {
      id: `asg-${employeeId}-${date}`,
      employeeId,
      date,
      shiftCode,
      countedHours: shift?.countedHours || 0,
      isOverride,
      overrideReason: isOverride ? overrideReason : undefined,
      comment: comment || undefined
    };

    let updatedAssignments = [...(currentVersion.assignments || [])];
    if (existingIndex >= 0) {
      if (shiftCode === 'OFF') {
        updatedAssignments.splice(existingIndex, 1);
      } else {
        updatedAssignments[existingIndex] = newAssignment;
      }
    } else if (shiftCode !== 'OFF') {
      updatedAssignments.push(newAssignment);
    }

    const updatedVersion: PlanningVersion = {
      ...currentVersion,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString()
    };

    const updatedVersions = versions.map(v => (v.id === currentVersion.id ? updatedVersion : v));
    setVersions(updatedVersions);
    StorageService.saveVersions(updatedVersions);

    // Audit logging
    const emp = employees.find(e => e.id === employeeId);
    const empName = emp ? `${emp.lastName} ${emp.firstName}` : employeeId;
    if (isOverride) {
      StorageService.addAuditLog(
        'OVERRIDE_APPLIED',
        `${userRole} (Session)`,
        `Dérogation appliquée pour ${empName} le ${date} : ${oldCode} → ${shiftCode}`,
        overrideReason
      );
    } else {
      StorageService.addAuditLog(
        existingIndex >= 0 ? 'ASSIGNMENT_MODIFIED' : 'ASSIGNMENT_CREATED',
        `${userRole} (Session)`,
        `Affectation modifiée pour ${empName} le ${date} : ${oldCode} → ${shiftCode}`
      );
    }

    setEditingCell(null);
  }, [editingCell, currentVersion, shifts, versions, userRole, employees]);

  const handleDeleteAssignment = useCallback(() => {
    if (!editingCell || !currentVersion) return;

    const { employeeId, date } = editingCell;
    const existing = (currentVersion.assignments || []).find(a => a.employeeId === employeeId && a.date === date);
    if (!existing) {
      setEditingCell(null);
      return;
    }

    const updatedAssignments = (currentVersion.assignments || []).filter(a => !(a.employeeId === employeeId && a.date === date));
    const updatedVersion: PlanningVersion = {
      ...currentVersion,
      assignments: updatedAssignments,
      updatedAt: new Date().toISOString()
    };

    const updatedVersions = versions.map(v => (v.id === currentVersion.id ? updatedVersion : v));
    setVersions(updatedVersions);
    StorageService.saveVersions(updatedVersions);

    const emp = employees.find(e => e.id === employeeId);
    StorageService.addAuditLog(
      'ASSIGNMENT_DELETED',
      `${userRole} (Session)`,
      `Affectation supprimée (mise à OFF) pour ${emp ? emp.lastName : employeeId} le ${date}`
    );

    setEditingCell(null);
  }, [editingCell, currentVersion, versions, employees, userRole]);

  // 6. Bulk Apply Generated Assignments
  const handleApplyGeneratedAssignments = useCallback((newAssignments: Assignment[]) => {
    if (!currentVersion) return;

    const updatedVersion: PlanningVersion = {
      ...currentVersion,
      assignments: newAssignments,
      updatedAt: new Date().toISOString()
    };

    const updatedVersions = versions.map(v => (v.id === currentVersion.id ? updatedVersion : v));
    setVersions(updatedVersions);
    StorageService.saveVersions(updatedVersions);

    StorageService.addAuditLog(
      'SCHEDULE_GENERATED',
      `${userRole} (Session)`,
      `Génération automatique appliquée : ${newAssignments.length} affectations créées`
    );
  }, [currentVersion, versions, userRole]);

  // 7. Version Management Handlers
  const handleSelectVersion = (versionId: string) => {
    setCurrentVersionId(versionId);
    StorageService.setActiveVersionId(versionId);
  };

  const handleCreateVersion = (name: string, comment: string, cloneFromCurrent: boolean) => {
    const newVer: PlanningVersion = {
      id: `ver-${Date.now()}`,
      name,
      versionNumber: versions.length + 1,
      periodId: currentVersion.periodId,
      status: 'DRAFT',
      author: `${userRole}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: currentVersion.startDate,
      endDate: currentVersion.endDate,
      assignments: cloneFromCurrent ? JSON.parse(JSON.stringify(currentVersion.assignments || [])) : [],
      validationScore: 100,
      comment
    };

    const updated = [...versions, newVer];
    setVersions(updated);
    setCurrentVersionId(newVer.id);
    StorageService.saveVersions(updated);
    StorageService.setActiveVersionId(newVer.id);

    StorageService.addAuditLog(
      'VERSION_CREATED',
      `${userRole} (Session)`,
      `Création de la version ${name} (v${newVer.versionNumber})`
    );
  };

  const handlePublishVersion = (versionId: string) => {
    const updated = versions.map(v => {
      if (v.id === versionId) {
        return { ...v, status: 'PUBLISHED' as const };
      }
      return v;
    });
    setVersions(updated);
    StorageService.saveVersions(updated);

    StorageService.addAuditLog(
      'VERSION_PUBLISHED',
      `${userRole} (Session)`,
      `Publication et verrouillage en lecture seule de la version (R35)`
    );
  };

  const handleArchiveVersion = (versionId: string) => {
    const updated = versions.map(v => {
      if (v.id === versionId) {
        return { ...v, status: 'ARCHIVED' as const };
      }
      return v;
    });
    setVersions(updated);
    StorageService.saveVersions(updated);

    StorageService.addAuditLog(
      'VERSION_ARCHIVED',
      `${userRole} (Session)`,
      `Archivage de la version (R40)`
    );
  };

  // 8. Employee & Qualification Handlers
  const handleUpdateEmployee = (emp: Employee) => {
    const updated = employees.map(e => (e.id === emp.id ? emp : e));
    setEmployees(updated);
    StorageService.saveEmployees(updated);
    StorageService.addAuditLog('EMPLOYEE_UPDATED', `${userRole} (Session)`, `Mise à jour employé ${emp.lastName} (${emp.matricule})`);
  };

  const handleAddEmployee = (emp: Employee) => {
    const updated = [...employees, emp];
    setEmployees(updated);
    StorageService.saveEmployees(updated);
    StorageService.addAuditLog('EMPLOYEE_CREATED', `${userRole} (Session)`, `Création employé ${emp.lastName} (${emp.matricule})`);
  };

  const handleUpdateQualification = (employeeId: string, shiftCode: string, status: QualificationStatus, note?: string) => {
    let updated = [...qualifications];
    const idx = updated.findIndex(q => q.employeeId === employeeId && q.shiftCode === shiftCode);
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], status, conditionNote: note };
    } else {
      updated.push({
        id: `q-${employeeId}-${shiftCode}`,
        employeeId,
        shiftCode,
        status,
        conditionNote: note
      });
    }
    setQualifications(updated);
    StorageService.saveQualifications(updated);
    StorageService.addAuditLog('QUALIFICATION_MODIFIED', `${userRole} (Session)`, `Habilitation ${shiftCode} modifiée pour l'employé ${employeeId}`);
  };

  // 9. Shifts & Rules Handlers
  const handleUpdateShift = (shift: Shift) => {
    const updated = shifts.map(s => (s.code === shift.code ? shift : s));
    setShifts(updated);
    StorageService.saveShifts(updated);
  };

  const handleAddShift = (shift: Shift) => {
    const updated = [...shifts, shift];
    setShifts(updated);
    StorageService.saveShifts(updated);
  };

  const handleUpdateRule = (rule: RuleDefinition) => {
    const updated = rules.map(r => (r.id === rule.id ? rule : r));
    setRules(updated);
    StorageService.saveRules(updated);
    StorageService.addAuditLog('RULE_MODIFIED', `${userRole} (Session)`, `Règle ${rule.id} modifiée : niveau=${rule.currentLevel}, actif=${rule.isEnabled}`);
  };

  const handleUpdateCoverage = (reqs: CoverageRequirement[]) => {
    setCoverageRequirements(reqs);
    StorageService.saveCoverageRequirements(reqs);
    StorageService.addAuditLog('COVERAGE_MODIFIED', `${userRole} (Session)`, `Exigences de couverture mises à jour (${reqs.length} règles)`);
  };

  const handleUpdateRotations = (patterns: RotationPattern[]) => {
    setRotationPatterns(patterns);
    StorageService.saveRotationPatterns(patterns);
    StorageService.addAuditLog('ROTATION_MODIFIED', `${userRole} (Session)`, `Motifs de rotation mis à jour (${patterns.length} cycles)`);
  };

  const handleImportData = (imported: any) => {
    if (imported.assignments && currentVersion) {
      const updatedVersion = {
        ...currentVersion,
        assignments: imported.assignments
      };
      const updatedVersions = versions.map(v => (v.id === currentVersion.id ? updatedVersion : v));
      setVersions(updatedVersions);
      StorageService.saveVersions(updatedVersions);
    }
  };

  // Currently editing cell item
  const selectedEditingEmployee = editingCell ? employees.find(e => e.id === editingCell.employeeId) : undefined;
  const currentEditingAssignment = editingCell
    ? (currentVersion.assignments || []).find(a => a.employeeId === editingCell.employeeId && a.date === editingCell.date)
    : undefined;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        onRoleChange={setUserRole}
        currentVersion={currentVersion}
        versions={versions}
        onSelectVersion={handleSelectVersion}
        onOpenVersionsModal={() => setIsVersionsModalOpen(true)}
        onOpenValidation={() => setIsValidationOpen(true)}
        validationScore={evaluation.score}
        issuesCount={evaluation.issues.length}
        hardViolationsCount={evaluation.issues.filter(i => i.level === 'HARD').length}
        warningsCount={evaluation.issues.filter(i => i.level === 'WARNING').length}
        onOpenAuditModal={() => setIsAuditModalOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenTestsRunner={() => setIsTestsModalOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        cloudSyncStatus={cloudSyncStatus}
        lastCloudSync={lastCloudSync}
        onTriggerCloudSync={handleTriggerCloudSync}
        authUser={authUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onResetData={() => {
          StorageService.resetToFactoryDefaults();
          window.location.reload();
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full px-2 sm:px-4 md:px-6 py-4">
        {activeTab === 'PLANNING' && (
          <PlanningGrid
            version={currentVersion}
            employees={employees}
            shifts={shifts}
            qualifications={qualifications}
            coverageRequirements={coverageRequirements}
            payPeriods={payPeriods}
            userRole={userRole}
            issues={evaluation.issues}
            evaluationIssues={evaluation.issues}
            statsByEmployee={evaluation.statsByEmployee}
            dailyCoverage={evaluation.dailyCoverage}
            onSelectCell={handleSelectCell}
            onQuickAssign={handleQuickAssign}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
            onOpenValidation={() => setIsValidationOpen(true)}
          />
        )}

        {activeTab === 'DASHBOARD' && (
          <DashboardView
            version={currentVersion}
            employees={employees}
            statsByEmployee={evaluation.statsByEmployee}
            dailyCoverage={evaluation.dailyCoverage}
            issues={evaluation.issues}
            totalHours={evaluation.totalCountedHours}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
            onOpenValidation={() => setIsValidationOpen(true)}
          />
        )}

        {activeTab === 'EMPLOYEES' && (
          <EmployeeManager
            employees={employees}
            shifts={shifts}
            qualifications={qualifications}
            userRole={userRole}
            onUpdateEmployee={handleUpdateEmployee}
            onAddEmployee={handleAddEmployee}
            onUpdateQualification={handleUpdateQualification}
          />
        )}

        {activeTab === 'SHIFTS' && (
          <ShiftManager
            shifts={shifts}
            userRole={userRole}
            onUpdateShift={handleUpdateShift}
            onAddShift={handleAddShift}
          />
        )}

        {activeTab === 'RULES' && (
          <RulesManager
            rules={rules}
            userRole={userRole}
            onUpdateRule={handleUpdateRule}
          />
        )}

        {activeTab === 'COVERAGE' && (
          <CoverageManager
            coverageRequirements={coverageRequirements}
            rotationPatterns={rotationPatterns}
            shifts={shifts}
            userRole={userRole}
            onUpdateCoverage={handleUpdateCoverage}
            onUpdateRotations={handleUpdateRotations}
          />
        )}
      </main>

      {/* Modals & Drawers */}

      {/* 1. Cell Assignment Modal */}
      {selectedEditingEmployee && editingCell && (
        <AssignmentModal
          isOpen={!!editingCell}
          onClose={() => setEditingCell(null)}
          employee={selectedEditingEmployee}
          date={editingCell.date}
          currentAssignment={currentEditingAssignment}
          shifts={shifts}
          qualifications={qualifications}
          userRole={userRole}
          onSave={handleSaveAssignment}
          onDelete={handleDeleteAssignment}
        />
      )}

      {/* 2. Planning Generator Modal */}
      <GeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        startDate={currentVersion.startDate}
        endDate={currentVersion.endDate}
        employees={employees}
        shifts={shifts}
        qualifications={qualifications}
        coverageRequirements={coverageRequirements}
        rotationPatterns={rotationPatterns}
        existingAssignments={currentVersion.assignments || []}
        onApplyAssignments={handleApplyGeneratedAssignments}
      />

      {/* 3. Validation Inspection Drawer */}
      <ValidationDrawer
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        issues={evaluation.issues}
        score={evaluation.score}
        onFocusCell={(empId, date) => {
          handleSelectCell(empId, date);
        }}
      />

      {/* 4. Versions Manager Modal */}
      <VersionsModal
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        versions={versions}
        currentVersionId={currentVersion.id}
        employees={employees}
        onSelectVersion={handleSelectVersion}
        onCreateVersion={handleCreateVersion}
        onPublishVersion={handlePublishVersion}
        onArchiveVersion={handleArchiveVersion}
      />

      {/* 5. Audit Trail Modal */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        logs={StorageService.getAuditLogs()}
      />

      {/* 6. Import/Export Certified Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        version={currentVersion}
        employees={employees}
        shifts={shifts}
        payPeriods={payPeriods}
        userRole={userRole}
        onImportData={handleImportData}
      />

      {/* 7. Certification & Tests Runner Modal */}
      <TestsRunnerModal
        isOpen={isTestsModalOpen}
        onClose={() => setIsTestsModalOpen(false)}
      />
    </div>
  );
}
