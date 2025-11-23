## AI Test Report — Failed and Blocked Cases

Generated: 2025-10-30

### Scope
- Suites covered: `auth.jsonl` (all passed), `admin.jsonl` (most passed), `supervisor.jsonl` (mixed; some blocked), `maintenance_tech.jsonl` (mixed; several blocked), others pending.
- Base URL: `https://192.168.1.74/` (trusted certificate confirmed).

---

### Maintenance Technician (`maintenance_tech.jsonl`)

#### Failed → Resolution
- TC-TECH-009 — Restricted access to approvals and inventory
  - Status: FIX PENDING (backend + frontend changes identified)
  - Backend change: Restrict read endpoints to management roles.
    - Update these handlers to require management roles (Admin included via deps):
      ```22:38:backend/app/api/v1/endpoints/inventory_transactions.py
      @router.get("", response_model=InventoryTransactionListResponse)
      async def list_inventory_transactions(
          page: int = Query(1, ge=1, description="Page number"),
          page_size: int = Query(25, ge=1, le=100, description="Items per page"),
          # ...
          db: Session = Depends(get_db),
          current_user: User = Depends(get_current_user)
      ):
      ```
      Replace `current_user: User = Depends(get_current_user)` with `current_user: User = Depends(require_management)` (from `backend/app/core/deps.py`) here and in `GET /{transaction_id}`.
  - Frontend change: Guard the page with required roles and hide nav for others.
    - Wrap `frontend/src/app/(dashboard)/inventory/transactions/page.tsx` with `ProtectedRoute` requiring `[UserRole.ADMIN, UserRole.INVENTORY_MANAGER]`.
    - Ensure nav links to inventory are hidden for unauthorized roles.

#### Blocked → Resolution Plan
- TC-TECH-004 — Request spare parts
  - Status: RESOLVED (retest PASSED)
  - Outcome: Request created successfully; row visible as PENDING in the request table
  - Note: Original 500 no longer reproducible during retest
    ```143:151:backend/app/api/v1/endpoints/spare_parts_requests.py
    @router.post("", response_model=SparePartsRequestResponse)
    async def create_spare_parts_request(
        request_data: SparePartsRequestCreate,
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(require_maintenance_tech)
    ):
    ```
    ```169:177:backend/app/api/v1/endpoints/spare_parts_requests.py
    try:
        # Create request
        request =
            maintenanceWorkId=request_data.maintenanceWorkId,
            sparePartId=request_data.sparePartId,
            quantityRequested=request_data.quantityRequested,
            status=SparePartsRequestStatus.PENDING,
            requestedBy=current_user.id
        )
    ```
  - Backend change: Rename the model variable to `spare_parts_request` and keep the FastAPI `request` as-is; construct via `SparePartsRequest(...)` and pass `request=request` to `log_activity`.

- TC-TECH-005 — View spare parts request status
  - Status: RESOLVED (retest PASSED)
  - Outcome: Newly created request displayed as PENDING in the list

- TC-TECH-006 — Complete maintenance work
  - Status: BLOCKED by API base URL mismatch
  - Observed: Calls to `...:8443/api/v1/maintenance-work/{id}/complete`
  - Root Cause: Default API base points to 8443.
    ```6:12:frontend/src/lib/api-config.ts
    export const getApiBaseUrl = (): string => {
      return (
        process.env.NEXT_PUBLIC_API_URL || 
        'https://192.168.1.74:8443/api/v1' || 
        'http://localhost:8001/api/v1'
      );
    };
    ```
  - Frontend change: Set `NEXT_PUBLIC_API_URL` to `http://192.168.1.74:8000/api/v1` (current backend exposure) or front the backend on 443 and use `https://192.168.1.74/api/v1`. Rebuild the frontend.
  - Backend note: Endpoints exist and validations are implemented in `backend/app/api/v1/endpoints/maintenance_work.py` (e.g., `PATCH /{work_id}/complete`).

- TC-TECH-010 — Cancel maintenance work
  - Status: BLOCKED by the same API base issue; unblocked by the change above.

- TC-TECH-011 — Invalid status transitions blocked
  - Status: BLOCKED (needs pre-seeded states + API base fix)
  - Action: Seed one COMPLETED work and one PENDING request; backend validation for transitions is already present in `maintenance_work.py`.

- TC-TECH-012 — Step-by-step progress with completion marks
  - Status: BLOCKED by API base mismatch
  - Action: After aligning API base, verify `PATCH /{work_id}/update-progress` works; only add optimistic UI after successful response.

---

### Supervisor (`supervisor.jsonl`)

#### Blocked
- TC-SUP-003/TC-SUP-004 — Machines and maintenance history access
  - Status: BLOCKED
  - Expected: Supervisor access per RBAC policy
  - Observed: 403 Forbidden
  - Root Cause: RBAC rules deny these pages for Supervisor
  - Proposed Fix: Confirm intended policy; if allowed, update role permissions and frontend guards

- TC-SUP-005 — Department maintenance requests visibility
  - Status: BLOCKED
  - Root Cause: Missing seeded requests in supervisor’s department
  - Proposed Fix: Seed representative requests; re-test

#### Passed (for reference)
- TC-SUP-001, TC-SUP-002 (after HTTPS + Simulate Scan)

---

### Admin (`admin.jsonl`)

#### Blocked (earlier; later passed after implementation)
- TC-ADMIN-012 — Create failure code with uniqueness (404 → fixed)
- TC-ADMIN-013 — Create maintenance type (404 → fixed)

#### Partially Blocked
- TC-ADMIN-011 — QR code view and mobile scan
  - Status: BLOCKED (mobile scan step)
  - Root Cause: Mobile camera permission/trust context issues during test
  - Proposed Fix: Use trusted HTTPS on device; ensure camera permissions and secure context

---

### Environment and Configuration Notes
- Frontend dev server runs on port 3000; app accessed at `https://192.168.1.74/`
- Observed API calls from frontend to `https://192.168.1.74:8443/api/v1/...` while `docker-compose.yml` sets `NEXT_PUBLIC_API_URL=http://192.168.1.74:8000/api/v1`
  - Action: Unify API base. Preferred: front an HTTPS reverse proxy and expose backend at `/api/v1` on 443; or switch frontend to use `http://192.168.1.74:8000/api/v1` consistently
- Camera access requires HTTPS and user permission; tests used Simulate Scan successfully

---

### Action Plan
1. Align API base URL (8443 vs 8000) and CORS; redeploy frontend
2. Fix spare parts request backend error (`SparePartsRequest.headers` attribute bug)
3. Implement/confirm RBAC for Tech and Supervisor routes; add backend authorization checks
4. Seed fixtures: parts requests (all statuses), supervisor department requests, and mixed request states for transition tests
5. Re-run blocked/failed tests: TC-TECH-004/005/006/010/011/012, TC-TECH-009, TC-SUP-003/004/005, TC-ADMIN-011

---

### Quick Index
- Failed: TC-TECH-009
- Blocked: TC-TECH-004, TC-TECH-005, TC-TECH-006, TC-TECH-010, TC-TECH-011, TC-TECH-012, TC-SUP-003, TC-SUP-004, TC-SUP-005, TC-ADMIN-011


