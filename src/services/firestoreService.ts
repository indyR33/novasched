/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  PlanningVersion,
  Employee,
  Shift,
  Qualification,
  CoverageRequirement,
  RotationPattern,
  RuleDefinition,
  PayPeriod,
  AuditLogEntry
} from '../types/planning';

const COLLECTIONS = {
  VERSIONS: 'planning_versions',
  EMPLOYEES: 'employees',
  SHIFTS: 'shifts',
  QUALIFICATIONS: 'qualifications',
  COVERAGE: 'coverage_requirements',
  ROTATIONS: 'rotation_patterns',
  RULES: 'rules',
  PAY_PERIODS: 'pay_periods',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings'
} as const;

export class FirestoreService {
  // -------------------------------------------------------------
  // 1. PLANNING VERSIONS
  // -------------------------------------------------------------
  public static async saveVersion(version: PlanningVersion): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.VERSIONS}/${version.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.VERSIONS, version.id), {
        ...version,
        orgId: 'novasched-ops',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveAllVersions(versions: PlanningVersion[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const v of versions) {
      batch.set(doc(db, COLLECTIONS.VERSIONS, v.id), {
        ...v,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.VERSIONS);
    }
  }

  public static async fetchVersions(): Promise<PlanningVersion[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.VERSIONS));
      return snap.docs.map(d => d.data() as PlanningVersion);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.VERSIONS);
    }
  }

  public static subscribeVersions(
    onUpdate: (versions: PlanningVersion[]) => void,
    onError?: (err: unknown) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, COLLECTIONS.VERSIONS),
      (snapshot) => {
        const versions = snapshot.docs.map(d => d.data() as PlanningVersion);
        onUpdate(versions);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.VERSIONS);
      }
    );
  }

  public static async deleteVersion(id: string): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.VERSIONS}/${id}`;
    try {
      await deleteDoc(doc(db, COLLECTIONS.VERSIONS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  // -------------------------------------------------------------
  // 2. EMPLOYEES
  // -------------------------------------------------------------
  public static async saveEmployee(employee: Employee): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.EMPLOYEES}/${employee.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.EMPLOYEES, employee.id), {
        ...employee,
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveAllEmployees(employees: Employee[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const emp of employees) {
      batch.set(doc(db, COLLECTIONS.EMPLOYEES, emp.id), {
        ...emp,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.EMPLOYEES);
    }
  }

  public static async fetchEmployees(): Promise<Employee[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
      return snap.docs.map(d => d.data() as Employee);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.EMPLOYEES);
    }
  }

  public static subscribeEmployees(
    onUpdate: (employees: Employee[]) => void,
    onError?: (err: unknown) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, COLLECTIONS.EMPLOYEES),
      (snapshot) => {
        const employees = snapshot.docs.map(d => d.data() as Employee);
        onUpdate(employees);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.EMPLOYEES);
      }
    );
  }

  // -------------------------------------------------------------
  // 3. SHIFTS
  // -------------------------------------------------------------
  public static async saveShift(shift: Shift): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.SHIFTS}/${shift.code}`;
    try {
      await setDoc(doc(db, COLLECTIONS.SHIFTS, shift.code), {
        ...shift,
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveAllShifts(shifts: Shift[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const s of shifts) {
      batch.set(doc(db, COLLECTIONS.SHIFTS, s.code), {
        ...s,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.SHIFTS);
    }
  }

  public static async fetchShifts(): Promise<Shift[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.SHIFTS));
      return snap.docs.map(d => d.data() as Shift);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.SHIFTS);
    }
  }

  public static subscribeShifts(
    onUpdate: (shifts: Shift[]) => void,
    onError?: (err: unknown) => void
  ): Unsubscribe {
    return onSnapshot(
      collection(db, COLLECTIONS.SHIFTS),
      (snapshot) => {
        const shifts = snapshot.docs.map(d => d.data() as Shift);
        onUpdate(shifts);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, COLLECTIONS.SHIFTS);
      }
    );
  }

  // -------------------------------------------------------------
  // 4. QUALIFICATIONS
  // -------------------------------------------------------------
  public static async saveQualification(q: Qualification): Promise<void> {
    if (!auth.currentUser) return;
    const id = q.employeeId && q.shiftCode ? `${q.employeeId}_${q.shiftCode}` : `q-${Date.now()}`;
    const path = `${COLLECTIONS.QUALIFICATIONS}/${id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.QUALIFICATIONS, id), {
        ...q,
        id,
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveAllQualifications(quals: Qualification[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const q of quals) {
      const id = `${q.employeeId}_${q.shiftCode}`;
      batch.set(doc(db, COLLECTIONS.QUALIFICATIONS, id), {
        ...q,
        id,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.QUALIFICATIONS);
    }
  }

  public static async fetchQualifications(): Promise<Qualification[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.QUALIFICATIONS));
      return snap.docs.map(d => d.data() as Qualification);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.QUALIFICATIONS);
    }
  }

  // -------------------------------------------------------------
  // 5. COVERAGE REQUIREMENTS
  // -------------------------------------------------------------
  public static async saveCoverageRequirement(req: CoverageRequirement): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.COVERAGE}/${req.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.COVERAGE, req.id), {
        ...req,
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveAllCoverage(coverage: CoverageRequirement[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const c of coverage) {
      batch.set(doc(db, COLLECTIONS.COVERAGE, c.id), {
        ...c,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.COVERAGE);
    }
  }

  public static async fetchCoverage(): Promise<CoverageRequirement[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.COVERAGE));
      return snap.docs.map(d => d.data() as CoverageRequirement);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.COVERAGE);
    }
  }

  // -------------------------------------------------------------
  // 6. ROTATION PATTERNS
  // -------------------------------------------------------------
  public static async saveRotationPattern(p: RotationPattern): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.ROTATIONS}/${p.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.ROTATIONS, p.id), {
        ...p,
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveAllRotations(patterns: RotationPattern[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const p of patterns) {
      batch.set(doc(db, COLLECTIONS.ROTATIONS, p.id), {
        ...p,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.ROTATIONS);
    }
  }

  public static async fetchRotations(): Promise<RotationPattern[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ROTATIONS));
      return snap.docs.map(d => d.data() as RotationPattern);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.ROTATIONS);
    }
  }

  // -------------------------------------------------------------
  // 7. RULES DEFINITIONS
  // -------------------------------------------------------------
  public static async saveRule(rule: RuleDefinition): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.RULES}/${rule.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.RULES, rule.id), {
        ...rule,
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async saveAllRules(rules: RuleDefinition[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const r of rules) {
      batch.set(doc(db, COLLECTIONS.RULES, r.id), {
        ...r,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.RULES);
    }
  }

  public static async fetchRules(): Promise<RuleDefinition[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.RULES));
      return snap.docs.map(d => d.data() as RuleDefinition);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.RULES);
    }
  }

  // -------------------------------------------------------------
  // 8. PAY PERIODS
  // -------------------------------------------------------------
  public static async saveAllPayPeriods(periods: PayPeriod[]): Promise<void> {
    if (!auth.currentUser) return;
    const batch = writeBatch(db);
    for (const p of periods) {
      batch.set(doc(db, COLLECTIONS.PAY_PERIODS, p.id), {
        ...p,
        orgId: 'novasched-ops'
      });
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PAY_PERIODS);
    }
  }

  public static async fetchPayPeriods(): Promise<PayPeriod[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.PAY_PERIODS));
      return snap.docs.map(d => d.data() as PayPeriod);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.PAY_PERIODS);
    }
  }

  // -------------------------------------------------------------
  // 9. AUDIT LOGS
  // -------------------------------------------------------------
  public static async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.AUDIT_LOGS}/${entry.id}`;
    try {
      await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, entry.id), {
        ...entry,
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.AUDIT_LOGS));
      return snap.docs.map(d => d.data() as AuditLogEntry);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.AUDIT_LOGS);
    }
  }

  // -------------------------------------------------------------
  // 10. SYSTEM SETTINGS
  // -------------------------------------------------------------
  public static async saveActiveVersionId(activeVersionId: string): Promise<void> {
    if (!auth.currentUser) return;
    const path = `${COLLECTIONS.SETTINGS}/system`;
    try {
      await setDoc(doc(db, COLLECTIONS.SETTINGS, 'system'), {
        id: 'system',
        activeVersionId,
        updatedAt: new Date().toISOString(),
        orgId: 'novasched-ops'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  public static async fetchActiveVersionId(): Promise<string | null> {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.SETTINGS));
      const docData = snap.docs.find(d => d.id === 'system')?.data();
      return (docData?.activeVersionId as string) || null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.SETTINGS);
    }
  }

  // -------------------------------------------------------------
  // 11. BULK HYDRATION & CLOUD SYNC
  // -------------------------------------------------------------
  public static async syncAllToFirestore(data: {
    versions: PlanningVersion[];
    employees: Employee[];
    shifts: Shift[];
    qualifications: Qualification[];
    coverageRequirements: CoverageRequirement[];
    rotationPatterns: RotationPattern[];
    rules: RuleDefinition[];
    payPeriods: PayPeriod[];
    activeVersionId: string;
  }): Promise<void> {
    if (!auth.currentUser) return;
    await Promise.all([
      this.saveAllVersions(data.versions),
      this.saveAllEmployees(data.employees),
      this.saveAllShifts(data.shifts),
      this.saveAllQualifications(data.qualifications),
      this.saveAllCoverage(data.coverageRequirements),
      this.saveAllRotations(data.rotationPatterns),
      this.saveAllRules(data.rules),
      this.saveAllPayPeriods(data.payPeriods),
      this.saveActiveVersionId(data.activeVersionId)
    ]);
  }

  public static async fetchAllFromFirestore(): Promise<{
    versions: PlanningVersion[];
    employees: Employee[];
    shifts: Shift[];
    qualifications: Qualification[];
    coverage: CoverageRequirement[];
    rotations: RotationPattern[];
    rules: RuleDefinition[];
    payPeriods: PayPeriod[];
    activeVersionId: string | null;
  }> {
    const [versions, employees, shifts, qualifications, coverage, rotations, rules, payPeriods, activeVersionId] =
      await Promise.all([
        this.fetchVersions(),
        this.fetchEmployees(),
        this.fetchShifts(),
        this.fetchQualifications(),
        this.fetchCoverage(),
        this.fetchRotations(),
        this.fetchRules(),
        this.fetchPayPeriods(),
        this.fetchActiveVersionId()
      ]);

    return {
      versions,
      employees,
      shifts,
      qualifications,
      coverage,
      rotations,
      rules,
      payPeriods,
      activeVersionId
    };
  }
}
