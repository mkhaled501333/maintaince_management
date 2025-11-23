# Spare Parts Return Workflow Implementation Plan

## Overview
Implement a two-step return workflow where technicians can request to return issued spare parts, and inventory managers process the return by creating IN transactions to restore stock.

## Database Changes

### 1. SparePartsRequestStatus Enum (No Changes)
**File:** `backend/app/models/spare_parts_request.py`
- Note: We do NOT add any new status values - the request status remains unchanged (e.g., `ISSUED`)
- We use boolean flags (`isRequestedReturn`, `isReturned`) to track return state without changing status

### 2. Add Return Fields to Model
**File:** `backend/app/models/spare_parts_request.py`
- Add columns:
  - `isRequestedReturn` (Boolean, default=False, nullable=False) - Flag indicating if return has been requested
  - `returnDate` (DateTime(timezone=True), nullable=True) - When return was processed
  - `isReturned` (Boolean, default=False, nullable=False) - Flag indicating if parts have been returned to inventory

### 3. Create Database Migration
**File:** `backend/alembic/versions/XXXX_add_return_fields_to_spare_parts_requests.py`
- Add migration to:
  - Add columns: `is_requested_return`, `return_date`, `is_returned` to `spare_parts_requests` table
  - Note: No enum changes needed - status remains unchanged

## Backend API Changes

### 4. Update Schemas
**File:** `backend/app/schemas/spare_parts_request.py`
- Update `SparePartsRequestResponse` to include:
  - `isRequestedReturn?: bool` - Boolean flag indicating if return has been requested
  - `returnDate?: Optional[datetime]` - Date when return was processed
  - `isReturned?: bool` - Boolean flag indicating if parts have been returned

### 5. Add Return Request Endpoint (Technician)
**File:** `backend/app/api/v1/endpoints/spare_parts_requests.py`
- Create `POST /{request_id}/return-request` endpoint
- Permission: `require_maintenance_tech`
- Validates:
  - Request status is `ISSUED`
  - Request belongs to technician's maintenance work (if not admin)
  - `isRequestedReturn` is False (not already requested)
  - `isReturned` is False (not already returned)
- Updates:
  - Sets `isRequestedReturn = True`
  - Status remains unchanged (stays as `ISSUED`)
- Creates activity log with action "RETURN_REQUEST"
- Returns updated `SparePartsRequestResponse`

### 6. Add Process Return Endpoint (Inventory Manager)
**File:** `backend/app/api/v1/endpoints/spare_parts_requests.py`
- Create `PATCH /{request_id}/process-return` endpoint
- Permission: `require_inventory_manager`
- Validates:
  - `isRequestedReturn` is True (return must be requested first)
  - `isReturned` is False (not already returned)
- Actions:
  - Creates `IN` inventory transaction to restore stock
    - `transactionType`: `TransactionType.IN`
    - `quantity`: `spare_parts_request.quantityRequested`
    - `referenceType`: "RETURN"
    - `referenceNumber`: `f"SPR-RET-{spare_parts_request.id}"`
    - `notes`: "دخول مرتجع" (Return Entry) - Include original request info
  - Updates spare part `currentStock` (adds quantity back)
  - Sets `isReturned = True`
  - Sets `returnDate` (current timestamp)
  - Status remains unchanged (stays as original status, e.g., `ISSUED`)
- Creates activity log with action "PROCESS_RETURN"
- Returns updated `SparePartsRequestResponse`

### 7. Update List and Get Endpoints
**File:** `backend/app/api/v1/endpoints/spare_parts_requests.py`
- Update `list_spare_parts_requests` to:
  - Include return fields in response (`isRequestedReturn`, `returnDate`, `isReturned`)
  - Support filtering by `isRequestedReturn === true` and `isReturned === false` for return requests page
- Update `get_spare_parts_request` to:
  - Include return fields in response (`isRequestedReturn`, `returnDate`, `isReturned`)

## Frontend Changes

### 8. Update TypeScript Types
**File:** `frontend/src/lib/types.ts`
- Add return fields to `SparePartsRequest` interface:
  - `isRequestedReturn?: boolean` - Boolean flag indicating if return has been requested
  - `returnDate?: string` - Date when return was processed
  - `isReturned?: boolean` - Boolean flag indicating if parts have been returned
- Note: No new status type needed - status remains unchanged

### 9. Update Locale Labels
**File:** `frontend/src/lib/locale.ts`
- Add constant for return request badge text:
  - `RETURN_REQUESTED_BADGE: 'طلب إرجاع'` (to be displayed when `isRequestedReturn === true` and `isReturned === false`)
- Add constant for return badge text:
  - `RETURNED_BADGE: 'تم الإرجاع'` (to be displayed when `isReturned === true`)

### 10. Update API Client
**File:** `frontend/src/lib/api/spare-parts-requests.ts`
- Add `requestReturn(requestId: number)` method
  - POST to `/api/v1/spare-parts-requests/${requestId}/return-request`
  - No body required
- Add `processReturn(requestId: number)` method
  - PATCH to `/api/v1/spare-parts-requests/${requestId}/process-return`

### 11. Add Return UI Components

**For Technicians:**
**Files:** 
- `frontend/src/components/maintenance/SparePartsRequestsList.tsx`
- `frontend/src/app/(dashboard)/maintenance/spare-parts-requests/SparePartsRequestDetails.tsx`
- Add "Request Return" button on ISSUED requests (only if `isRequestedReturn === false` and `isReturned === false`)
- Display return request status if already requested (`isRequestedReturn === true`)

**For Inventory Managers:**
**New Page:** `frontend/src/app/(dashboard)/inventory/return-requests/page.tsx`
- Create new page "طلبات الارجاع" (Return Requests)
- Display list of all return requests where:
  - `isRequestedReturn === true`
  - `isReturned === false`
- Show request details: part number, part name, quantity, requested by, requested date
- Add "OK" or "Process Return" button for each request
- When "OK" is pressed:
  - Calls `processReturn(requestId)` API
  - Updates `isReturned = True` and `returnDate`
  - Creates IN transaction with "دخول مرتجع" (Return Entry) state
  - Refreshes the list

**Files:**
- `frontend/src/components/inventory/ApprovedRequestsList.tsx` (optional: add return requests section)
- Display "تم الإرجاع" badge/label next to request when `isReturned === true`
- Display return date when `isReturned === true`

### 12. Update Status Colors and Badges
**Files:** 
- `frontend/src/components/inventory/ApprovedRequestsList.tsx`
- `frontend/src/components/maintenance/SparePartsRequestsList.tsx`
- `frontend/src/lib/locale.ts`

- Add "طلب إرجاع" badge styling when `isRequestedReturn === true` and `isReturned === false` (e.g., orange/yellow: `text-orange-600`, `bg-orange-100`)
- Add "تم الإرجاع" badge styling when `isReturned === true` (e.g., gray: `text-gray-600`, `bg-gray-100`)
- Display return badges next to request status based on return flags

### 13. Update Filter Options
**File:** `frontend/src/components/inventory/ApprovedRequestsList.tsx`
- Add filter option for return requests (`isRequestedReturn === true` and `isReturned === false`)
- Optionally: Add filter for `isReturned === true` requests

## Implementation Steps

1. **Database Layer**
   - Add return fields to model (no enum changes)
   - Create and run Alembic migration
   - Test migration rollback

2. **Backend API Layer**
   - Update schemas with return fields
   - Implement return request endpoint (technician)
   - Implement process return endpoint (inventory manager)
   - Update existing endpoints to include return data
   - Add activity logging for return actions

3. **Frontend Layer**
   - Update TypeScript types
   - Add API client methods
   - Update locale labels
   - Add UI components for return actions
   - Update status displays and filters

4. **Testing**
   - Test technician return request flow
   - Test inventory manager return processing
   - Verify stock restoration
   - Verify activity logs
   - Test edge cases (already returned, invalid status, etc.)

## Key Implementation Details

- **Return Workflow:** 
  1. Technician requests return → `isRequestedReturn = True`, status remains unchanged (e.g., `ISSUED`)
  2. Inventory manager views "طلبات الارجاع" (Return Requests) page with list of pending returns
  3. Inventory manager presses "OK" → `isReturned = True`, `returnDate` set, creates IN transaction with "دخول مرتجع" (Return Entry)
  
- **Stock Restoration:** Happens when inventory manager processes return (creates IN transaction with "دخول مرتجع" state)
- **Return Flags:** 
  - `isRequestedReturn` - indicates if return has been requested by technician
  - `isReturned` - indicates if parts have been returned to inventory (processed by inventory manager)
- **UI Display:** 
  - Inventory manager sees "طلبات الارجاع" page with list of return requests
  - When `isReturned === true`, show "تم الإرجاع" badge next to the request
- **Transaction State:** IN transactions for returns include "دخول مرتجع" (Return Entry) in notes
- **Audit Trail:** Full activity logging for both return request and processing
- **Permissions:** 
  - Technicians can only return their own issued parts (for their maintenance work)
  - Inventory managers can view and process any return request
- **Validation:** 
  - Return request only allowed on `ISSUED` status, `isRequestedReturn === false`, and `isReturned === false`
  - Process return only allowed when `isRequestedReturn === true` and `isReturned === false` (status can be any value, typically `ISSUED`)

## Database Schema Changes Summary

```sql
-- Add columns (no enum changes - status remains unchanged)
ALTER TABLE spare_parts_requests 
  ADD COLUMN is_requested_return BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN return_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN is_returned BOOLEAN NOT NULL DEFAULT FALSE;
```

## API Endpoints Summary

### New Endpoints
- `POST /api/v1/spare-parts-requests/{request_id}/return-request`
  - No body required
  - Permission: `MAINTENANCE_TECH`
  - Sets `isRequestedReturn = True`
  - Status remains unchanged (stays as `ISSUED`)

- `PATCH /api/v1/spare-parts-requests/{request_id}/process-return`
  - Permission: `INVENTORY_MANAGER`
  - Sets `isReturned = True` and `returnDate` (current timestamp)
  - Creates IN transaction and restores stock
  - Status remains unchanged

## Related Files

### Backend
- `backend/app/models/spare_parts_request.py`
- `backend/app/schemas/spare_parts_request.py`
- `backend/app/api/v1/endpoints/spare_parts_requests.py`
- `backend/app/models/inventory_transaction.py`
- `backend/alembic/versions/XXXX_add_return_fields_to_spare_parts_requests.py`

### Frontend
- `frontend/src/lib/types.ts`
- `frontend/src/lib/locale.ts`
- `frontend/src/lib/api/spare-parts-requests.ts`
- `frontend/src/components/maintenance/SparePartsRequestsList.tsx`
- `frontend/src/components/inventory/ApprovedRequestsList.tsx`
- `frontend/src/app/(dashboard)/maintenance/spare-parts-requests/SparePartsRequestDetails.tsx`
- `frontend/src/app/(dashboard)/inventory/return-requests/page.tsx` (NEW - Return Requests page for inventory managers)

