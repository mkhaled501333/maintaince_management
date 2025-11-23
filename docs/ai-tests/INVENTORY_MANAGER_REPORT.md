## Inventory Manager Test Report — Failed and Blocked

Generated: 2025-10-30

### Scope
- Suite: `inventory_manager.jsonl`
- Base URL: `https://192.168.1.74/`

---

### Failed
- TC-INV-012 — Restricted access to approvals and assignments
  - Status: FAILED
  - Expected: Access denied or redirect to `/unauthorized`
  - Observed: 403 responses from API and on-page error (no redirect) when visiting `/maintenance/dashboard`
  - Evidence: Page showed "Error loading maintenance requests" with 403 errors in console
  - Root Cause: Frontend route renders page with error instead of redirect; RBAC handling inconsistent
  - Proposed Fix:
    - Frontend: Wrap `/maintenance/dashboard` with role guard to redirect unauthorized roles to `/unauthorized`
    - Backend: Keep 403 as-is; ensure UI consumes it to navigate away

---

### Blocked / Pending (Environment or Data Preconditions)
- TC-INV-005 — Record IN transaction and stock increases
  - Status: BLOCKED
  - Repro Steps:
    1) Open `/inventory/transactions`
    2) Click "New Transaction"
    3) Try to select Spare Part → dropdown only shows "Select a spare part" (no options)
    4) Fill remaining fields (Type=IN, Quantity=20, Reference=PURCHASE, Unit Price=22.00, Notes)
    5) Click "Save Transaction" → validation error: "Spare part is required"
  - Observed:
    - Spare Part select is empty; cannot proceed
    - Console shows 422 responses when opening the form (likely prefetch call)
  - Suspected Root Cause:
    - Spare parts listing for the transaction form is not loading (API contract/validation mismatch or RBAC filter)
    - Verify the endpoint the form calls to populate parts and ensure it returns options for Inventory Manager
  - Proposed Fix:
    - Backend: Ensure the parts list endpoint used by the form returns data for Inventory Manager; resolve 422
    - Frontend: Handle empty state with error messaging and retry; ensure the select binds `value`/`label` correctly
    - Data: Confirm at least one active part exists (e.g., `SP-001-ABC`)

- TC-INV-006 — Issue approved parts (OUT) and deduct inventory
  - Blocker: Needs an APPROVED parts request available to Inventory Manager
  - Action: Use approved request (from Manager) and issue; verify OUT transaction and deduction

- TC-INV-007 — Adjustment transaction sets exact quantity
  - Blocker: Not executed; needs adjustment UI/API confirmation
  - Action: Record ADJUSTMENT to exact quantity; verify stock and transaction

- TC-INV-008 — Transfer transaction logs deduction
  - Blocker: Not executed; needs transfer UI/API confirmation
  - Action: Record TRANSFER; verify deduction and transaction

- TC-INV-009 — View transaction history with filters
  - Blocker: Requires sufficient transactions to validate filters and sorting
  - Action: Seed transactions (IN/OUT/ADJUSTMENT/TRANSFER); re-run

- TC-INV-011 — Manage approved requests list
  - Blocker: Needs approved requests present
  - Action: Seed or approve requests; verify details view and issuance availability

---

### Passed (for reference)
- TC-INV-001 — Inventory list with search/filter/sort
- TC-INV-002 — Create new spare part
- TC-INV-003 — Edit spare part stock and location
- TC-INV-004 — Low stock alerts display correctly
- TC-INV-010 — Inventory analytics (tabs + CSV export + reorder list)

---

### Action Plan
1. Add frontend role guard to `/maintenance/dashboard` to redirect unauthorized users
2. Seed/prepare data for transactions and approved requests
3. Execute create/edit flows and verify activity logs (INV-002/003)
4. Seed low-stock scenarios; verify alerts and dashboard count (INV-004)
5. Re-run blocked tests: INV-002/003/004/005/006/007/008/009/011


