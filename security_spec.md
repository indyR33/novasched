# Security Specification & Threat Model

## 1. Data Invariants
1. **Planning Version Integrity**: A planning version cannot have arbitrary keys, must maintain bounded assignment arrays, must enforce valid status (`DRAFT`, `SIMULATION`, `PUBLISHED`, `ARCHIVED`), and published versions cannot have assignments altered by unauthorized users.
2. **Identity & Authorization**: Write operations require authenticated, email-verified users or configured system administrator (via ADMIN_EMAIL secret).
3. **Array Boundaries**: Arrays (such as `assignments` or `steps`) must be strictly constrained in size to prevent Denial of Wallet memory/storage exhaustion.
4. **ID Hardening**: All document keys must match `^[a-zA-Z0-9_\-]+$` and be <= 128 chars.
5. **No Blind Blanket Queries**: Any listing must restrict or filter by tenant/org/ownership context.
6. **No Shadow Fields**: Extra undocumented properties must be rejected on document creation and restricted on update.

---

## 2. The Dirty Dozen Payloads

### Payload 1 (ID Poisoning Attack)
- Target: `/planning_versions/{versionId}`
- ID: `ver-${'A'.repeat(2000)}` or `ver/../injection`
- Expected: PERMISSION_DENIED

### Payload 2 (Denial of Wallet - Monster Array)
- Target: `/planning_versions/ver-01`
- Content: `assignments` array with 50,000 unbounded dummy elements
- Expected: PERMISSION_DENIED

### Payload 3 (Shadow Field Injection on Creation)
- Target: `/employees/emp-999`
- Content: Valid employee fields + `{ "isSuperAdmin": true, "unauthorizedBackdoor": "hacked" }`
- Expected: PERMISSION_DENIED

### Payload 4 (Unverified Email Write Attempt)
- Target: `/shifts/M1`
- Auth: `request.auth.token.email_verified == false`
- Expected: PERMISSION_DENIED

### Payload 5 (Unauthenticated Write)
- Target: `/rules/R01`
- Auth: `null`
- Expected: PERMISSION_DENIED

### Payload 6 (Unchecked Status Mutation / Terminal Override)
- Target: `/planning_versions/ver-01`
- Content: Attempt to mutate a locked/archived state with invalid enum `"HACKED_STATUS"`
- Expected: PERMISSION_DENIED

### Payload 7 (Type Confusion / Value Poisoning)
- Target: `/employees/emp-01`
- Content: `{ weeklyContractHours: "Thirty-Five" }` (string instead of number)
- Expected: PERMISSION_DENIED

### Payload 8 (Negative Hours / Out of Bounds)
- Target: `/shifts/S1`
- Content: `{ countedHours: -12.5 }`
- Expected: PERMISSION_DENIED

### Payload 9 (Oversized Payload / String Flooding)
- Target: `/coverage_requirements/cov-01`
- Content: `{ subFamily: "X".repeat(50000) }`
- Expected: PERMISSION_DENIED

### Payload 10 (Audit Log Tampering / Retroactive Modification)
- Target: `/audit_logs/log-01`
- Action: Update or delete existing immutable audit log entry
- Expected: PERMISSION_DENIED

### Payload 11 (Blanket Query Scraping)
- Target: Query on `/employees` without authenticated session
- Expected: PERMISSION_DENIED

### Payload 12 (Cross-Tenant Org Spoofing)
- Target: `/settings/system`
- Content: `{ orgId: "unauthorized-external-tenant" }`
- Expected: PERMISSION_DENIED
