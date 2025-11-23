# Factory Maintenance Management System - Comprehensive Test Strategy

**Version:** 2.0  
**Date:** 2025-01-XX  
**Purpose:** Complete testing strategy covering all user roles, functions, and workflows

**Version History:**
- **v2.0** - Enhanced with Machine Management, File Attachments, Failure Codes, Maintenance Types, Assignment Workflow, Error Handling, and Edge Cases testing (Added 35+ new test cases)
- **v1.0** - Initial comprehensive test strategy

---

## Table of Contents

1. [Introduction](#introduction)
2. [Test Scope](#test-scope)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Testing Strategy by User Role](#testing-strategy-by-user-role)
5. [End-to-End Workflows](#end-to-end-workflows)
6. [Feature Testing Matrix](#feature-testing-matrix)
7. [Test Data Requirements](#test-data-requirements)
8. [Test Execution Plan](#test-execution-plan)
9. [Acceptance Criteria Testing](#acceptance-criteria-testing)
10. [Error Handling & Edge Cases Testing](#10-error-handling--edge-cases-testing)

---

## 1. Introduction

This comprehensive test strategy document provides step-by-step testing instructions for all functionality in the Factory Maintenance Management Web Application. The system supports five distinct user roles, each with specific permissions and responsibilities.

### System Overview
- **Frontend:** Next.js 14 with TypeScript, React, Tailwind CSS
- **Backend:** FastAPI with Python, SQLAlchemy ORM
- **Database:** MySQL 8.0
- **Key Features:** QR Code Scanning, Maintenance Workflow, Inventory Management, Analytics & Reporting

---

### AI-Executable Test Cases

For browser-driven AI testing and progress tracking, use the JSONL suite in `docs/ai-tests/`:
- `admin.jsonl`, `supervisor.jsonl`, `maintenance_tech.jsonl`, `maintenance_manager.jsonl`, `inventory_manager.jsonl`
- `workflows.jsonl` (end-to-end), `errors.jsonl` (error/edge cases)
- See `docs/ai-tests/README.md` for the schema and usage.

## 2. Test Scope

### In Scope
- ✅ User Authentication & Authorization
- ✅ QR Code Scanning & Machine Management
- ✅ Problem Reporting & Maintenance Requests
- ✅ Maintenance Work Progress Tracking
- ✅ Spare Parts Inventory Management
- ✅ Inventory Transactions
- ✅ Spare Parts Request & Approval Workflow
- ✅ File Attachments
- ✅ Activity Logging & Audit Trail
- ✅ Analytics & Reporting
- ✅ User Management
- ✅ Department Management
- ✅ Failure Codes & Maintenance Types
- ✅ Machine-Spare Parts Relationships

### Out of Scope
- Preventive Maintenance (future feature)
- Offline capabilities
- Email/SMS notifications
- Advanced predictive analytics

---

## 3. User Roles & Permissions

### Role Summary

| Role | Permissions | Primary Responsibilities |
|------|-------------|------------------------|
| **ADMIN** | Full system access | User management, system configuration, view all data |
| **SUPERVISOR** | Report problems, view department data | Scan QR codes, report machine problems |
| **MAINTENANCE_TECH** | Execute maintenance work | View assigned work, update progress, request parts |
| **MAINTENANCE_MANAGER** | Approve parts, view all requests | Monitor maintenance operations, approve parts requests |
| **INVENTORY_MANAGER** | Manage inventory, issue parts | Manage spare parts, issue approved requests |

---

## 4. Testing Strategy by User Role

### 4.1 ADMIN User Testing

#### Setup
1. Create ADMIN user via backend or database
2. Login with admin credentials
3. Access: Dashboard → Admin section

#### Test Cases

**TC-ADMIN-001: User Management**
1. Navigate to: `/admin/users`
2. Click "Create New User" button
3. Fill in user details:
   - Username: `testuser1`
   - Full Name: `Test User One`
   - Password: `password123`
   - Role: `SUPERVISOR`
   - Active: `Yes`
4. Click "Save" button
5. **Expected:** User appears in users list
6. Verify in Activity Logs that user creation is logged

**TC-ADMIN-002: View All Users**
1. Navigate to: `/admin/users`
2. **Expected:** See list of all users with role, status
3. Verify pagination works with >25 users
4. Test search by username or full name

**TC-ADMIN-003: Edit User**
1. From users list, click "Edit" on any user
2. Change role from `SUPERVISOR` to `MAINTENANCE_TECH`
3. Click "Save"
4. **Expected:** Changes reflected in list immediately
5. Verify activity log shows update with before/after values

**TC-ADMIN-004: Deactivate User**
1. From users list, click "Delete" on a user
2. Confirm deactivation
3. **Expected:** User status shows as inactive
4. User cannot login anymore

**TC-ADMIN-005: Department Management**
1. Navigate to: `/admin/departments`
2. Click "Create New Department"
3. Fill in:
   - Name: `Production Line A`
   - Description: `Main production assembly line`
   - Company Code: `COM001`
   - Company Name: `Janssen Industries`
4. Click "Save"
5. **Expected:** Department appears in list
6. Verify can be selected when creating machines

**TC-ADMIN-006: Activity Logs Viewing**
1. Navigate to: `/admin/activity-logs`
2. **Expected:** See all system activities
3. Test filters: action type, entity type, date range
4. Test export to CSV
5. Verify logs include user, timestamp, IP address

**TC-ADMIN-007: All Analytics Reports**
1. Navigate to: `/analytics/maintenance`
2. Test Downtime Report:
   - Select date range (last 30 days)
   - Filter by department
   - Verify charts and data tables
   - Test export to CSV
3. Test Maintenance Cost Report:
   - Filter by machine
   - Verify cost calculations include parts costs
   - Check pie chart displays maintenance types
4. Test Failure Analysis Report:
   - Filter by failure category
   - Verify top recurring issues identified
   - Check resolution time averages

**TC-ADMIN-008: Access All Data**
1. Verify admin can view:
   - All maintenance requests (all statuses)
   - All machines (all departments)
   - All spare parts inventory
   - All inventory transactions
   - All spare parts requests

**TC-ADMIN-009: Machine Management - Create Machine**
1. Navigate to: `/machines`
2. Click "Create New Machine" button
3. Fill in machine details:
   - Name: `CNC Machine 002`
   - Model: `XYZ-5000`
   - Serial Number: `SN002345`
   - Department: `Production Line A`
   - Location: `Floor 2, Bay 12`
   - Installation Date: `2024-01-15`
   - Status: `OPERATIONAL`
4. Click "Save"
5. **Expected:** 
   - Machine created successfully
   - QR code auto-generated and displayed
   - Machine appears in machines list

**TC-ADMIN-010: Machine Management - Update Status**
1. From machines list, click "Edit" on a machine
2. Change status from `OPERATIONAL` to `MAINTENANCE`
3. Click "Save"
4. **Expected:** 
   - Machine status updated
   - Status displayed with color indicator
   - Machine appears with MAINTENANCE status in dashboard
   - Activity log shows status change

**TC-ADMIN-011: Machine Management - QR Code Generation**
1. Create new machine (from TC-ADMIN-009)
2. Click "View QR Code" button
3. **Expected:** 
   - QR code image displays
   - QR code is downloadable
4. Scan QR code with mobile device
5. **Expected:** 
   - Machine information displays correctly
   - All machine details accessible

**TC-ADMIN-012: Failure Codes Management**
1. Navigate to: `/admin/failure-codes`
2. Click "Create New Failure Code"
3. Fill in:
   - Code: `MECH003`
   - Description: `Hydraulic Leak - Severe`
   - Category: `HYDRAULIC`
4. Click "Save"
5. **Expected:** Failure code appears in list and available in dropdowns
6. Try to create duplicate code
7. **Expected:** Error: "Code already exists"

**TC-ADMIN-013: Maintenance Types Management**
1. Navigate to: `/admin/maintenance-types`
2. Click "Create New Maintenance Type"
3. Fill in:
   - Name: `Emergency Repair`
   - Description: `Immediate repairs for critical failures`
4. Click "Save"
5. **Expected:** Maintenance type available for selection in problem reporting

---

### 4.2 SUPERVISOR User Testing

#### Setup
1. Create SUPERVISOR user: username: `supervisor1`, password: `pass123`
2. Login as supervisor
3. Ensure QR codes exist for machines

#### Test Cases

**TC-SUP-001: QR Code Scanning**
1. Navigate to: `/qr-scanner`
2. **Expected:** Camera view opens (on mobile device)
3. Allow camera permissions if prompted
4. Scan a valid machine QR code
5. **Expected:** Machine details display immediately
6. Verify machine name, model, location, status shown

**TC-SUP-002: Problem Reporting**
1. After QR scan (TC-SUP-001), click "Report Problem"
2. Fill in Problem Reporting Form:
   - Problem Description: `Machine making unusual noise during operation`
   - Priority: `HIGH`
   - Failure Code: Select `MECH001 - Motor Overheating` (or any)
   - Maintenance Type: Select `Corrective` (optional)
3. Attach file: upload a test image
4. Click "Submit"
5. **Expected:** 
   - Success message appears
   - Navigate to machine detail view
   - Request shows in maintenance history with PENDING status
   - Activity log shows CREATE action

**TC-SUP-003: View Department Machines**
1. Navigate to: `/machines`
2. **Expected:** See all machines (or filtered by department)
3. Click on a machine to view details
4. Verify machine information panel shows:
   - Basic info (name, model, serial number)
   - Current status
   - Location
   - Department
   - Installation date

**TC-SUP-004: View Maintenance History**
1. Navigate to: `/machines/{id}` (any machine)
2. Click "Maintenance History" tab
3. **Expected:** See all past maintenance requests for machine
4. Verify entries show:
   - Date reported
   - Problem description
   - Status
   - Assigned technician
   - Completion date

**TC-SUP-005: View Machine Maintenance Requests**
1. Navigate to: `/maintenance/dashboard`
2. **Expected:** See requests for machines in supervisor's department
3. Verify can filter by status (PENDING, IN_PROGRESS, COMPLETED)
4. Click on a request to see details
5. Verify attachments are viewable

**TC-SUP-006: Restricted Access**
1. Try to access: `/admin/users`
2. **Expected:** Redirected to `/unauthorized`
3. Try to access: `/inventory/spare-parts`
4. **Expected:** Redirected to `/unauthorized`

**TC-SUP-007: File Attachment Upload**
1. Report problem (from TC-SUP-002)
2. Upload multiple file types:
   - 1 image file (JPG, size < 5MB)
   - 1 PDF document (size < 10MB)
3. Verify files upload successfully with progress indicator
4. Verify file preview works for image
5. Verify file download works
6. Check file size limits
7. **Expected:** 
   - Files attached to request
   - File metadata recorded
   - Activity log shows attachment creation

**TC-SUP-008: File Upload Validation**
1. Attempt to upload file > 10MB
2. **Expected:** Error: "File size exceeds maximum limit"
3. Attempt to upload .exe file
4. **Expected:** Error: "File type not allowed"

---

### 4.3 MAINTENANCE_TECH User Testing

#### Setup
1. Create MAINTENANCE_TECH user: username: `tech1`, password: `pass123`
2. Create a maintenance request with PENDING status
3. Assign request to tech1
4. Login as tech1

#### Test Cases

**TC-TECH-001: View Assigned Work**
1. Navigate to: `/maintenance/technician`
2. **Expected:** See dashboard with assigned maintenance requests
3. Verify requests show:
   - Machine name and location
   - Problem description
   - Priority level (color coded)
   - Status
   - Date assigned

**TC-TECH-002: Accept Work Assignment**
1. From technician dashboard, click on a PENDING request
2. Click "Accept Work" button
3. **Expected:** 
   - Status changes to IN_PROGRESS
   - Started time is recorded
   - Request shows in "In Progress" tab
   - Activity log shows status change

**TC-TECH-003: Update Work Progress**
1. Open an IN_PROGRESS request
2. Click "Update Progress" tab
3. Fill in maintenance steps:
   - Step 1: `Initial inspection complete`
   - Step 2: `Identified root cause`
   - Step 3: `Ordered replacement parts`
4. Click "Save" button
5. **Expected:** Steps saved, visible in progress history
6. Verify timestamp recorded for each step

**TC-TECH-004: Request Spare Parts**
1. On an IN_PROGRESS request, click "Request Parts" tab
2. Click "Add Part Request" button
3. Select spare part: Choose from dropdown
4. Quantity: `2`
5. Click "Save" button
6. **Expected:** 
   - Request appears in parts request list
   - Status: PENDING
   - Shows awaiting manager approval
   - Maintenance request status changes to WAITING_PARTS

**TC-TECH-005: View Spare Parts Request Status**
1. Navigate to spare parts requests section
2. **Expected:** See list of own requests with status
3. Verify statuses: PENDING, APPROVED, REJECTED, ISSUED
4. Click on approved request to see details
5. Verify can see approval notes if provided

**TC-TECH-006: Complete Maintenance Work**
1. Open an IN_PROGRESS request
2. Click "Complete Work" tab
3. Fill in Work Description: `Replaced motor bearings and recalibrated system`
4. Upload completion photos (attachments)
5. Click "Complete Work" button
6. **Expected:** 
   - Work status changes to COMPLETED
   - Completion date recorded
   - Maintenance request status changes to COMPLETED
   - Machine status returns to OPERATIONAL
   - Downtime automatically calculated
   - Activity log shows completion

**TC-TECH-007: QR Code Scan for Work**
1. Navigate to: `/qr-scanner`
2. Scan a machine with assigned maintenance request
3. **Expected:** See machine info with active maintenance request
4. Click "View Request" to see work details
5. Verify can update progress from this view

**TC-TECH-008: View Maintenance History**
1. Navigate to: `/machines/{id}` (any machine)
2. Click "Maintenance History"
3. **Expected:** See complete history of all work done
4. Verify can filter by date range
5. Check attachments are accessible

**TC-TECH-009: Restricted Access**
1. Try to approve spare parts request
2. **Expected:** Cannot access approval function
3. Try to access inventory transactions
4. **Expected:** Redirected to `/unauthorized`

**TC-TECH-010: Cancel Maintenance Work**
1. Open an IN_PROGRESS request
2. Click "Cancel Work" button
3. Fill in cancellation reason: `Parts unavailable - awaiting delivery`
4. Confirm cancellation
5. **Expected:** 
   - Work status changes to CANCELLED
   - Request status changes to CANCELLED
   - Machine status returns to OPERATIONAL
   - Activity log shows cancellation with reason

**TC-TECH-011: Invalid Status Transition**
1. Try to accept already COMPLETED work
2. **Expected:** Error message: "Cannot perform this action on completed work"
3. Try to update progress on PENDING (unaccepted) work
4. **Expected:** Error message: "Work must be accepted first"
5. Verify work status unchanged

**TC-TECH-012: Work Progress with Steps**
1. Open an IN_PROGRESS request
2. Click "Update Progress" tab
3. Add multiple maintenance steps:
   - Step 1: `Initial inspection complete` (mark complete)
   - Step 2: `Root cause identified`
   - Step 3: `Parts ordered`
4. Save progress after each step
5. **Expected:** 
   - Steps saved with timestamps
   - Completed steps show checkmark and timestamp
   - Progress visible in history
   - All steps persistent

---

### 4.4 MAINTENANCE_MANAGER User Testing

#### Setup
1. Create MAINTENANCE_MANAGER user: username: `manager1`, password: `pass123`
2. Create spare parts requests with PENDING status
3. Login as manager1

#### Test Cases

**TC-MGR-001: View All Maintenance Requests**
1. Navigate to: `/maintenance/dashboard`
2. **Expected:** See all maintenance requests (all statuses, all technicians)
3. Verify can filter by:
   - Status
   - Priority
   - Machine
   - Department
   - Date range
   - Assigned technician
4. Verify can sort by date, priority

**TC-MGR-002: Approve Spare Parts Request**
1. Navigate to: `/maintenance/dashboard`
2. Click on a request with WAITING_PARTS status
3. Click "Spare Parts Requests" tab
4. Find a PENDING parts request
5. Click "Approve" button
6. Fill in Approval Notes: `Approved for standard maintenance procedure`
7. Click "Confirm Approval"
8. **Expected:** 
   - Request status changes to APPROVED
   - Approval timestamp recorded
   - Activity log shows approval action
   - Request now visible to inventory manager

**TC-MGR-003: Reject Spare Parts Request**
1. Find another PENDING parts request
2. Click "Reject" button
3. Fill in Rejection Reason: `Stock available from current inventory`
4. Click "Confirm Rejection"
5. **Expected:** 
   - Request status changes to REJECTED
   - Rejection timestamp recorded
   - Reason visible in request details
   - Activity log shows rejection
   - Technician notified (if notifications implemented)

**TC-MGR-004: View Analytics**
1. Navigate to: `/analytics/maintenance`
2. Test Downtime Report:
   - Select last quarter
   - Group by department
   - **Expected:** See downtime trends by department
   - Export to CSV
3. Test Failure Analysis Report:
   - Filter by failure category: `MECHANICAL`
   - **Expected:** See top mechanical failures
   - Check average resolution time
4. Test Maintenance Cost Report:
   - Select specific machine
   - **Expected:** See total costs and cost breakdown

**TC-MGR-005: View Department Performance**
1. Navigate to: `/analytics/maintenance`
2. In Downtime Report, filter by department
3. **Expected:** See downtime metrics for each machine in department
4. Verify can identify problem machines
5. Check failure patterns and frequencies

**TC-MGR-006: Bulk Request Review**
1. Navigate to parts requests list
2. Verify can see all PENDING requests at once
3. Use filters: status = PENDING
4. **Expected:** Efficient workflow to review multiple requests

**TC-MGR-007: Restricted Access**
1. Try to issue spare parts
2. **Expected:** Cannot access issuance function
3. Try to edit spare parts inventory
4. **Expected:** Redirected to `/unauthorized`

**TC-MGR-008: Assign Request to Technician**
1. Navigate to: `/maintenance/dashboard`
2. View PENDING maintenance request
3. Click "Assign to Technician" button
4. Select technician: `tech1`
5. Set priority: `HIGH`
6. Add assignment notes: `Urgent - production impact`
7. Click "Assign"
8. **Expected:** 
   - Request assigned to tech1
   - Status updated appropriately
   - Activity log shows assignment with user details
   - Tech1 sees request in assigned work list

**TC-MGR-009: Reassign Request**
1. View assigned request (currently to tech1)
2. Click "Reassign" button
3. Select new technician: `tech2`
4. Add reason: `Original technician unavailable`
5. Confirm reassignment
6. **Expected:** 
   - Request now assigned to tech2
   - Original assignment record maintained in history
   - Both technicians see update
   - Activity log shows reassignment

**TC-MGR-010: Bulk Parts Approval**
1. Navigate to parts requests list
2. Select multiple PENDING requests (3-5 requests)
3. Click "Approve All Selected"
4. Add approval notes: `Standard maintenance parts`
5. Confirm bulk approval
6. **Expected:** 
   - All requests change to APPROVED status
   - Individual approval records created
   - Approval timestamp recorded for each
   - Activity log shows bulk operation

---

### 4.5 INVENTORY_MANAGER User Testing

#### Setup
1. Create INVENTORY_MANAGER user: username: `invmgr1`, password: `pass123`
2. Create spare parts in inventory
3. Create approved spare parts requests
4. Login as invmgr1

#### Test Cases

**TC-INV-001: View Spare Parts Inventory**
1. Navigate to: `/inventory/spare-parts`
2. **Expected:** See complete inventory list
3. Verify columns: Part Number, Name, Category, Location, Current Stock, Min Stock, Max Stock, Status
4. Test search by part number or name
5. Test filter by category
6. Test sort by stock level

**TC-INV-002: Create New Spare Part**
1. Click "Create New Part" button
2. Fill in form:
   - Part Number: `SP-001-ABC`
   - Name: `Motor Bearing Type A`
   - Description: `High-speed motor bearing 6205ZZ`
   - Category: `MECHANICAL`
   - Current Stock: `50`
   - Minimum Stock: `10`
   - Maximum Stock: `100`
   - Unit Price: `25.50`
   - Location: `Warehouse A - Shelf 3B`
3. Click "Save"
4. **Expected:** New part appears in inventory list
5. Verify in Activity Logs

**TC-INV-003: Edit Spare Part**
1. Click "Edit" on any spare part
2. Change Current Stock: `75`
3. Update Location: `Warehouse B - Shelf 5A`
4. Click "Save"
5. **Expected:** Changes saved, list updated
6. Verify activity log shows before/after values

**TC-INV-004: Low Stock Alerts**
1. Navigate to inventory list
2. Find parts with Current Stock < Minimum Stock
3. **Expected:** Stock status shows "CRITICAL" (red indicator)
4. Verify parts below 1.5x minimum show "LOW" (orange)
5. Check dashboard widget shows low stock count

**TC-INV-005: Inventory Transaction - Add Stock (IN)**
1. Navigate to: `/inventory/transactions`
2. Click "Record Transaction"
3. Select: Transaction Type: `IN`
4. Select Spare Part: Choose any part
5. Quantity: `20`
6. Reference Type: `PURCHASE`
7. Unit Cost: `22.00`
8. Notes: `New shipment received from supplier`
9. Click "Save"
10. **Expected:** 
    - Transaction recorded
    - Spare part stock automatically increased by 20
    - New total stock shown in list
    - Activity log created

**TC-INV-006: Inventory Transaction - Issue Parts (OUT)**
1. Navigate to approved requests: `/inventory/approved-requests`
2. Find an APPROVED request
3. Click "Issue Parts" button
4. Review: Part, quantity, request details
5. Click "Confirm Issue"
6. **Expected:** 
    - Request status changes to ISSUED
    - Inventory automatically deducted
    - Transaction recorded (OUT type)
    - Activity log shows issuance
    - Request linked to technician

**TC-INV-007: Inventory Transaction - Adjustment**
1. Navigate to: `/inventory/transactions`
2. Click "Record Transaction"
3. Select: Transaction Type: `ADJUSTMENT`
4. Select Spare Part
5. New Quantity: `45`
6. Notes: `Physical count correction`
7. Click "Save"
8. **Expected:** 
    - Stock adjusted to exact quantity
    - Transaction recorded
    - Reason noted

**TC-INV-008: Inventory Transaction - Transfer**
1. Click "Record Transaction"
2. Select: Transaction Type: `TRANSFER`
3. Select Spare Part
4. Quantity: `10`
5. Reference Type: `TRANSFER`
6. Notes: `Transferred to Warehouse B`
7. Click "Save"
8. **Expected:** 
    - Stock deducted from current location
    - Transaction recorded for tracking

**TC-INV-009: View Transaction History**
1. Navigate to: `/inventory/transactions`
2. **Expected:** See complete transaction history
3. Filter by: 
   - Transaction Type (IN/OUT/ADJUSTMENT/TRANSFER)
   - Spare Part
   - Date range
4. Sort by date (descending)
5. Verify each entry shows: type, quantity, user, timestamp

**TC-INV-010: Inventory Reports**
1. Navigate to: `/analytics/inventory`
2. Test Stock Levels Report:
   - **Expected:** Charts showing inventory levels by category
   - Test export to CSV
3. Test Consumption Report:
   - Select date range (last month)
   - **Expected:** See parts consumption trends
   - Identify high-consumption parts
4. Test Valuation Report:
   - **Expected:** Total inventory value
   - Value by category
5. Test Reorder Report:
   - **Expected:** Parts below minimum stock
   - Recommended reorder quantities

**TC-INV-011: Approved Requests Management**
1. Navigate to: `/inventory/approved-requests`
2. **Expected:** See all APPROVED parts requests
3. Verify details shown:
   - Requesting technician
   - Part details
   - Quantity
   - Date requested
   - Maintenance work reference
4. Click "Issue Parts" to complete issuance (covered in TC-INV-006)

**TC-INV-012: Restricted Access**
1. Try to approve spare parts requests
2. **Expected:** Cannot access approval function
3. Try to assign maintenance work
4. **Expected:** Redirected to `/unauthorized`

---

## 5. End-to-End Workflows

### 5.1 Complete Maintenance Cycle (Happy Path)

**Participants:** SUPERVISOR → MAINTENANCE_TECH → MAINTENANCE_MANAGER → INVENTORY_MANAGER

**Steps:**
1. **SUPERVISOR: Report Problem**
   - Login as supervisor1
   - Scan QR code for Machine-001
   - Click "Report Problem"
   - Fill: Description: `Oil leak detected`, Priority: `HIGH`
   - Upload photo
   - Submit
   - **Verify:** Request created with PENDING status

2. **MAINTENANCE_TECH: Accept & Start Work**
   - Login as tech1
   - Navigate to `/maintenance/technician`
   - See new request assigned
   - Click "Accept Work"
   - **Verify:** Status = IN_PROGRESS

3. **MAINTENANCE_TECH: Update Progress**
   - Click "Update Progress"
   - Add step: `Located source of leak`
   - Save progress
   - **Verify:** Step recorded with timestamp

4. **MAINTENANCE_TECH: Request Parts**
   - Click "Request Parts"
   - Part: `Gasket Kit A`, Quantity: `1`
   - Submit request
   - **Verify:** Request status = PENDING (awaiting approval)

5. **MAINTENANCE_MANAGER: Approve Parts**
   - Login as manager1
   - Navigate to maintenance request
   - See parts request
   - Click "Approve"
   - Add notes: `Standard maintenance part`
   - Approve
   - **Verify:** Status = APPROVED

6. **INVENTORY_MANAGER: Issue Parts**
   - Login as invmgr1
   - Navigate to `/inventory/approved-requests`
   - See approved request
   - Click "Issue Parts"
   - Confirm
   - **Verify:** 
     - Status = ISSUED
     - Inventory stock decreased
     - Transaction recorded

7. **MAINTENANCE_TECH: Complete Work**
   - Login as tech1
   - Open request
   - Click "Complete Work"
   - Description: `Replaced gasket kit and sealed connections`
   - Upload completion photos
   - Complete work
   - **Verify:**
     - Request status = COMPLETED
     - Machine status = OPERATIONAL
     - Downtime calculated
     - Activity log entries complete

8. **SUPERVISOR: Verify Completion**
   - Login as supervisor1
   - View machine history
   - **Verify:** All steps visible in timeline
   - **Verify:** Completion date recorded
   - **Verify:** Total downtime displayed

### 5.2 Inventory Management Cycle

**Participant:** INVENTORY_MANAGER

**Steps:**
1. **Add New Part**
   - Create part: `Electric Motor 5HP`
   - Stock: 0, Min: 5, Max: 20
   - Save
   - **Verify:** Part created, shows CRITICAL status

2. **Receive Shipment (IN Transaction)**
   - Record IN transaction: Quantity 15
   - Unit cost: $150
   - Reference: PURCHASE
   - Save
   - **Verify:** Stock now 15, status = ADEQUATE

3. **Physical Count Adjustment**
   - Find discrepancy during count
   - Record ADJUSTMENT transaction
   - New quantity: 14
   - Notes: `Damaged unit found`
   - Save
   - **Verify:** Stock adjusted to 14

4. **Issue for Maintenance**
   - Issue 2 units for maintenance
   - (Follow TC-INV-006 steps)
   - **Verify:** Stock now 12
   - Transaction linked to maintenance work

5. **Reorder Alert**
   - Issue 8 more units
   - **Verify:** Stock now 4 (< minimum 5)
   - Dashboard shows low stock alert
   - **Verify:** Alert shows in inventory reports

---

## 6. Feature Testing Matrix

| Feature | Test Cases | Priority | Owner Role |
|---------|-----------|----------|-----------|
| User Authentication | TC-AUTH-001 to TC-AUTH-005 | High | All |
| QR Code Scanning | TC-SUP-001 | High | SUPERVISOR, TECH |
| Problem Reporting | TC-SUP-002 | High | SUPERVISOR |
| Work Acceptance | TC-TECH-002 | High | TECH |
| Progress Tracking | TC-TECH-003, TC-TECH-012 | High | TECH |
| Parts Request | TC-TECH-004 | High | TECH |
| Parts Approval | TC-MGR-002, TC-MGR-003, TC-MGR-010 | High | MANAGER |
| Parts Issuance | TC-INV-006 | High | INVENTORY |
| Work Completion | TC-TECH-006 | High | TECH |
| Work Cancellation | TC-TECH-010 | Medium | TECH |
| Inventory Management | TC-INV-001 to TC-INV-012 | High | INVENTORY |
| User Management | TC-ADMIN-001 to TC-ADMIN-008 | High | ADMIN |
| Machine Management | TC-ADMIN-009 to TC-ADMIN-011 | High | ADMIN |
| Failure Codes | TC-ADMIN-012 | Medium | ADMIN |
| Maintenance Types | TC-ADMIN-013 | Medium | ADMIN |
| Request Assignment | TC-MGR-008, TC-MGR-009 | High | MANAGER |
| Activity Logging | Verify in all test cases | High | All |
| Analytics & Reports | TC-MGR-004, TC-INV-010, TC-ADMIN-007 | Medium | MANAGER, INVENTORY, ADMIN |
| File Attachments | TC-SUP-007, TC-SUP-008, TC-ERR-003 | High | SUPERVISOR, TECH |
| Downtime Calculation | Verify in work completion | High | SYSTEM |
| Low Stock Alerts | TC-INV-004, TC-INV-010 | Medium | INVENTORY |
| Error Handling | TC-ERR-001 to TC-ERR-015 | High | All |
| Status Validation | TC-TECH-011, TC-ERR-007 | High | All |

---

## 7. Test Data Requirements

### Base Test Data (Pre-populate in test environment)

**Departments:**
- ID: 1, Name: Production Line A, Code: COM001
- ID: 2, Name: Packaging, Code: COM001
- ID: 3, Name: Quality Control, Code: COM001

**Users (one per role):**
- admin1 (ADMIN)
- supervisor1 (SUPERVISOR, Department: 1)
- tech1 (MAINTENANCE_TECH, Department: 1)
- manager1 (MAINTENANCE_MANAGER, Department: 1)
- invmgr1 (INVENTORY_MANAGER, Department: 1)

**Machines (with QR codes):**
- ID: 1, Name: CNC Machine 001, QR: UUID-001, Department: 1, Status: OPERATIONAL
- ID: 2, Name: Conveyor Belt 01, QR: UUID-002, Department: 1, Status: OPERATIONAL
- ID: 3, Name: Welding Station A, QR: UUID-003, Department: 2, Status: OPERATIONAL

**Spare Parts:**
- Part Number: MOTOR-BEAR-001, Name: Motor Bearing A, Stock: 50, Min: 10
- Part Number: GASKET-KIT-A, Name: Gasket Kit A, Stock: 25, Min: 5
- Part Number: BELT-A5, Name: Conveyor Belt A5, Stock: 3, Min: 10 (Low Stock)

**Failure Codes:**
- MECH001: Motor Overheating, Category: MECHANICAL
- MECH002: Bearing Failure, Category: MECHANICAL
- ELEC001: Short Circuit, Category: ELECTRICAL

**Maintenance Types:**
- Corrective Maintenance
- Preventive Maintenance
- Emergency Repair

---

## 8. Test Execution Plan

### Phase 1: Authentication & Authorization (Day 1)
- Test all user login/logout flows
- Verify role-based access control
- Test session management
- **Exit Criteria:** All users can login, no unauthorized access

### Phase 2: Core Features (Days 2-3)
- QR Code scanning
- Problem reporting
- Work acceptance & progress
- Parts request workflow
- **Exit Criteria:** Complete maintenance cycle works end-to-end

### Phase 3: Inventory Management (Day 4)
- All inventory transactions
- Stock management
- Low stock alerts
- Parts issuance
- **Exit Criteria:** All inventory operations work correctly

### Phase 4: Analytics & Reports (Day 5)
- All report types
- Filters and exports
- Data accuracy verification
- **Exit Criteria:** Reports generate accurate data

### Phase 5: Admin Functions (Day 6)
- User management
- Department management
- Activity logs
- **Exit Criteria:** All admin functions work

### Phase 6: Integration & Edge Cases (Day 7)
- Complete workflows end-to-end
- Error handling
- Edge cases and boundary conditions
- Performance testing
- **Exit Criteria:** System works as integrated whole

---

## 9. Acceptance Criteria Testing

Based on PRD acceptance criteria, verify:

### Authentication (Story 1.2)
✅ AC: Users can login/logout
✅ AC: Five roles supported (ADMIN, SUPERVISOR, TECH, MANAGER, INVENTORY)
✅ AC: Role-based access control implemented
✅ AC: Session management works

### QR Code System (Story 2.2)
✅ AC: Mobile-optimized scanner interface
✅ AC: HTML5 Camera API works
✅ AC: Works on iOS and Android
✅ AC: Successful scan displays machine info
✅ AC: Error handling for failed scans

### Problem Reporting (Story 3.1)
✅ AC: Form accessible after QR scan
✅ AC: Captures description, priority, failure code
✅ AC: File attachments work
✅ AC: Auto-records timestamp and reporter
✅ AC: Creates request with PENDING status

### Maintenance Work (Story 5.1)
✅ AC: Work progress can be updated
✅ AC: Work description and notes recorded
✅ AC: Start and completion times tracked
✅ AC: Status updates logged and visible
✅ AC: Work completion triggers downtime calculation

### Inventory Management (Story 4.1)
✅ AC: Parts can be created, edited, deleted
✅ AC: Inventory levels tracked in real-time
✅ AC: Low stock alerts generated
✅ AC: Parts organized by groups/categories
✅ AC: Location tracking implemented

### Spare Parts Requests (Story 4.3)
✅ AC: Requests can be created during work
✅ AC: Requests routed to managers
✅ AC: Approved requests sent to inventory
✅ AC: Issued parts deducted from inventory
✅ AC: Usage tracked and linked

### Analytics (Story 7.2)
✅ AC: Downtime reports show performance
✅ AC: Cost analysis available
✅ AC: Failure analysis identifies issues
✅ AC: Reports exportable

---

## Testing Checklist Summary

### Critical Path Testing
- [ ] Complete maintenance cycle (all 5 roles)
- [ ] Complete inventory management cycle
- [ ] User authentication for all roles
- [ ] Role-based access restrictions
- [ ] Activity logging for all actions
- [ ] Downtime calculation accuracy
- [ ] Real-time inventory updates
- [ ] File attachments upload/view
- [ ] QR code scanning on actual mobile devices
- [ ] All reports generate and export

### Verification Points
- [ ] All status transitions work correctly
- [ ] Data integrity maintained (no orphans)
- [ ] Timestamps auto-populate correctly
- [ ] Activity logs include all required fields
- [ ] UI updates without full page refresh
- [ ] Error messages are user-friendly
- [ ] Loading states appear during API calls
- [ ] Success confirmations shown
- [ ] Navigation works between related pages
- [ ] Mobile responsiveness verified

---

## 10. Error Handling & Edge Cases Testing

### 10.1 Data Validation Errors

**TC-ERR-001: Required Field Validation**
1. Attempt to create user without username
2. **Expected:** Error: "Username is required"
3. Attempt to create machine without name
4. **Expected:** Error: "Machine name is required"
5. Attempt to report problem without description
6. **Expected:** Error: "Problem description is required"

**TC-ERR-002: Invalid Data Formats**
1. Enter text in numeric fields (stock quantity)
2. **Expected:** Error: "Must be a number"
3. Enter future date in completion date field
4. **Expected:** Warning or validation error
5. Enter negative quantity for inventory
6. **Expected:** Error: "Quantity cannot be negative"

**TC-ERR-003: File Upload Validation**
1. Upload file > 10MB
2. **Expected:** Error: "File size exceeds 10MB limit"
3. Upload executable file (.exe)
4. **Expected:** Error: "File type not allowed"
5. Upload 50 files to single request
6. **Expected:** Warning or limit enforcement

**TC-ERR-004: Unique Constraint Violations**
1. Create user with existing username
2. **Expected:** Error: "Username already exists"
3. Create machine with duplicate serial number
4. **Expected:** Error: "Serial number must be unique"
5. Create duplicate failure code
6. **Expected:** Error: "Failure code already exists"

### 10.2 Permission & Authorization Errors

**TC-ERR-005: Unauthorized Access Attempts**
1. Login as SUPERVISOR, try to access `/admin/users`
2. **Expected:** Redirected to `/unauthorized`
3. Login as MAINTENANCE_TECH, try to approve parts request
4. **Expected:** Error: "Insufficient permissions" or redirect
5. Login as SUPERVISOR, try to issue inventory
6. **Expected:** Access denied

**TC-ERR-006: Cross-User Data Access**
1. Create request as supervisor1
2. Login as tech2 (not assigned to request)
3. Try to complete another technician's work
4. **Expected:** Error: "Access denied - work not assigned to you"

### 10.3 Workflow & State Errors

**TC-ERR-007: Invalid Status Transitions**
1. Try to complete PENDING work (not started)
2. **Expected:** Error: "Work must be started first"
3. Try to accept already COMPLETED work
4. **Expected:** Error: "Cannot modify completed work"
5. Try to approve already ISSUED request
6. **Expected:** Error: "Request already issued"

**TC-ERR-008: Missing Dependency Errors**
1. Try to create machine without department
2. **Expected:** Error: "Department is required"
3. Try to issue part not in inventory
4. **Expected:** Error: "Part not found in inventory"
5. Try to assign request to inactive technician
6. **Expected:** Warning: "Technician is inactive"

### 10.4 Network & Performance Errors

**TC-ERR-009: Network Failure Handling**
1. During file upload, disconnect network
2. **Expected:** Error message shown, retry option available
3. During form submission, cause timeout
4. **Expected:** Error message, form data preserved
5. During work completion, network error occurs
6. **Expected:** Transaction rolled back, error logged

**TC-ERR-010: Concurrent Access**
1. Two managers try to approve same request simultaneously
2. **Expected:** First succeeds, second gets error
3. Two technicians try to accept same request
4. **Expected:** First succeeds, second sees already assigned
5. Edit machine while another user viewing
6. **Expected:** Both can work, latest changes win on save

### 10.5 Data Integrity & Edge Cases

**TC-ERR-011: Large Dataset Handling**
1. Generate report with 10,000 records
2. **Expected:** Pagination works, export functions properly
3. Search inventory with result set > 1000 items
4. **Expected:** Results paginated, search responsive
5. View machine with 500 maintenance history items
6. **Expected:** History paginated, performance acceptable

**TC-ERR-012: Boundary Conditions**
1. Enter stock quantity = 0
2. **Expected:** Acceptable, shows as zero stock
3. Enter quantity exactly at max limit
4. **Expected:** Acceptable, warning if needed
5. Select date range of 365 days for report
6. **Expected:** Report generates, may take longer

**TC-ERR-013: Deletion Validation**
1. Try to delete department with machines
2. **Expected:** Error: "Cannot delete - department has associated machines"
3. Try to delete machine with active maintenance requests
4. **Expected:** Error: "Cannot delete - machine has pending maintenance"
5. Try to delete user with active assignments
6. **Expected:** Warning or error, require reassignment first

### 10.6 Search & Filter Edge Cases

**TC-ERR-014: Empty Search Results**
1. Search for non-existent machine name
2. **Expected:** "No machines found" message displayed
3. Filter requests by impossible date range
4. **Expected:** Empty list, appropriate message
5. Search with special characters: `<script>alert('xss')</script>`
6. **Expected:** Search handles safely, no errors

**TC-ERR-015: Special Character Handling**
1. Enter machine name with symbols: `CNC-001 & More#`
2. **Expected:** Accepted and stored correctly
3. Upload file with unicode characters in name
4. **Expected:** Filename sanitized, upload successful
5. Enter description with emoji and special chars
6. **Expected:** Stored and displayed correctly

---

## Appendix: Test Environment Setup

### Prerequisites
- Docker installed and running
- MySQL 8.0 database
- Test data loaded
- All users created
- QR codes generated for machines
- Sample spare parts in inventory

### Commands
```bash
# Start backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Start frontend
cd frontend
npm install
npm run dev

# Run database migrations
cd backend
alembic upgrade head
```

---

**Document End**

