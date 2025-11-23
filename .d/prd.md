# Factory Maintenance Management Web Application

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **QR Code**: QR code scanner library for mobile browsers
- **File Upload**: For machine photos
- **Docker**: Containerization for deployment

## Database Schema

### Core Tables

- **users**: id, email, password, name, role (ADMIN, SUPERVISOR, MAINTENANCE_TECH, MAINTENANCE_MANAGER, INVENTORY_MANAGER)
- **departments**: id, name, description, company_code, company_name
- **machines**: id, qr_code, name, model, serial_number, department_id, location, installation_date, status
- **spare_parts**: id, part_number, part_name, description, group_number, group_name, quantity, min_quantity, unit_price, location
- **maintenance_requests**: id, machine_id, reporter_id, status (PENDING, IN_PROGRESS, WAITING_PARTS, COMPLETED, CANCELLED), priority, reported_at, problem_description, failure_code_id, maintenance_type_id
- **maintenance_work**: id, request_id, technician_id, started_at, completed_at, work_description, maintenance_steps
- **spare_parts_requests**: id, maintenance_work_id, spare_part_id, quantity_requested, status (PENDING, APPROVED, REJECTED, ISSUED), requested_by, approved_by, approved_at
- **spare_parts_usage**: id, spare_parts_request_id, quantity_used, used_at
- **spare_parts_inventory_transactions**: id, spare_part_id, transaction_type (IN, OUT, ADJUSTMENT, TRANSFER), quantity, reference_type (PURCHASE, MAINTENANCE, ADJUSTMENT, TRANSFER), reference_id, performed_by, transaction_date, notes, unit_cost
- **attachments**: id, entity_type, entity_id, file_url, file_type, uploaded_by, uploaded_at
- **failure_codes**: id, code, description, category
- **maintenance_types**: id, name, description
- **machine_spare_parts**: id, machine_id, spare_part_id, min_qty, max_qty, created_at
- **machine_downtime**: id, machine_id, request_id, start_time, end_time, duration_minutes, downtime_type, auto_calculated
- **activity_logs**: id, user_id, action, entity_type, entity_id, description, changes, ip_address, user_agent, created_at
- **preventive_maintenance_tasks**: id, machine_id, task_name, description, frequency_type (DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY), frequency_value, next_due_date, last_completed_at, assigned_to, status, instructions
- **preventive_maintenance_logs**: id, task_id, machine_id, completed_by, completed_at, notes, status, created_at

## User Roles & Permissions

### Admin

- Manage all users, departments, machines, spare parts
- View all reports and analytics
- System configuration

### Supervisor

- Scan QR codes to report machine problems
- Upload photos of issues
- View department's maintenance requests
- View machine history

### Maintenance Technician

- Scan QR codes to view machine maintenance requests
- View assigned maintenance requests
- Update work progress and maintenance steps
- Request spare parts from inventory
- Record work completion

### Maintenance Manager

- View all maintenance requests
- Approve/reject spare parts requests
- View analytics and reports

### Inventory Manager

- Manage spare parts inventory (add, edit, delete parts)
- Track inventory transactions (IN/OUT movements)
- Issue approved spare parts
- Record new stock purchases and deliveries
- Perform inventory adjustments and transfers
- View comprehensive inventory reports
- Set reorder levels and alerts
- Generate inventory valuation reports
- Monitor stock levels and consumption trends

## Key Features Implementation

### 1. QR Code Scanning & Problem Reporting

- Supervisor scans machine QR code using mobile camera
- Form captures: problem description, priority level, attachments (multiple files)
- Auto-record timestamp and reporter
- Create maintenance request with PENDING status
- Attach files to maintenance request via attachments table
- Start downtime tracking

### 1.1. QR Code Scanning for Technicians

- Technician scans machine QR code to view all requests for that machine
- Mobile-optimized QR scanner interface
- Display active requests (PENDING, IN_PROGRESS, WAITING_PARTS)
- Show machine details and history
- Quick action to accept/view request details
- Filter by status and priority
- Direct link to maintenance work form

### 2. Maintenance Workflow

- Dashboard shows requests filtered by role
- Technician accepts request → status: IN_PROGRESS
- Technician fills maintenance steps/work description
- If spare parts needed → create spare parts request → status: WAITING_PARTS
- Technician completes work → status: COMPLETED
- End downtime tracking

### 3. Spare Parts Management

- Technician requests parts during maintenance
- Request goes to Maintenance Manager for approval
- Once approved by manager, Inventory Manager issues parts
- System deducts from inventory
- Track usage per maintenance request
- Alert when quantity < min_quantity

### 3.1. Comprehensive Inventory Management

**Purpose:** Complete inventory tracking with in/out movements, reporting, and analytics.

**Key Features:**

**Inventory Transactions:**
- Record all stock movements (IN/OUT/ADJUSTMENT/TRANSFER)
- Track purchases, deliveries, maintenance usage, adjustments
- Link transactions to maintenance requests, purchases, or adjustments
- Store unit costs for valuation and cost tracking
- Full audit trail with user, date, and reference information

**Stock Management:**
- Real-time inventory levels with automatic updates
- Low stock alerts based on min_quantity thresholds
- Group-based inventory organization (by group_number/group_name)
- Location tracking for physical inventory management
- Batch/lot number tracking for traceability

**Inventory Reports:**
- Stock level reports by part, group, or location
- Consumption reports showing usage patterns
- Valuation reports with current stock value
- Movement reports (in/out transactions by date range)
- Reorder reports for parts below minimum levels
- Cost analysis reports for maintenance expenses

**Purchase Management:**
- Record new stock purchases and deliveries
- Track supplier information and purchase costs
- Link purchases to inventory transactions
- Monitor purchase history and supplier performance

**Adjustments & Transfers:**
- Inventory adjustments for stock corrections
- Transfer parts between locations or departments
- Cycle counting and physical inventory reconciliation
- Write-off damaged or obsolete parts

**Automatic Quantity Update Mechanism:**

**Purpose:** Real-time inventory quantity tracking with complete audit trail and automatic updates.

**How Spare Parts Quantity is Updated:**

**1. Transaction-Based Quantity Updates:**
- All quantity changes tracked via `spare_parts_inventory_transactions` table
- `spare_parts.quantity` field updated automatically based on transaction type:
  - **IN transaction**: `quantity += transaction.quantity` (new stock arrivals)
  - **OUT transaction**: `quantity -= transaction.quantity` (parts issued for maintenance)
  - **ADJUSTMENT transaction**: `quantity = new_adjusted_value` (inventory corrections)
  - **TRANSFER transaction**: `quantity -= transferred_amount` (inter-location transfers)

**2. Transaction Triggers for Quantity Updates:**

**When spare parts are ISSUED (OUT transaction):**
1. Maintenance Manager approves spare parts request
2. Inventory Manager issues parts → Creates OUT transaction
3. System automatically deducts from `spare_parts.quantity`
4. Updates `spare_parts_usage` table with actual usage

**When new stock arrives (IN transaction):**
1. Inventory Manager records purchase/delivery
2. Creates IN transaction with received quantity
3. System automatically adds to `spare_parts.quantity`

**When adjustments are made (ADJUSTMENT transaction):**
1. Physical inventory count reveals discrepancy
2. Inventory Manager creates ADJUSTMENT transaction
3. System updates `spare_parts.quantity` to correct value

**3. Real-time Quantity Calculation:**

```typescript
// Helper function in /lib/inventory.ts
function updateSparePartQuantity(sparePartId: number, transactionType: string, quantity: number) {
  const currentQuantity = await getCurrentQuantity(sparePartId);
  
  let newQuantity;
  switch(transactionType) {
    case 'IN': newQuantity = currentQuantity + quantity; break;
    case 'OUT': newQuantity = currentQuantity - quantity; break;
    case 'ADJUSTMENT': newQuantity = quantity; break;
    case 'TRANSFER': newQuantity = currentQuantity - quantity; break;
  }
  
  await updateSparePart(sparePartId, { quantity: newQuantity });
}
```

**4. Workflow Integration:**

**Maintenance Workflow Integration:**
1. Technician requests parts → `spare_parts_requests` created
2. Manager approves → Status changes to APPROVED
3. Inventory Manager issues parts → Creates OUT transaction
4. System automatically deducts from inventory
5. Links to `spare_parts_usage` for tracking

**Purchase Workflow Integration:**
1. New stock arrives → Inventory Manager records delivery
2. Creates IN transaction with purchase details
3. System automatically adds to inventory
4. Updates cost information for valuation

**5. Low Stock Alerts:**
- Current quantity vs `min_quantity` threshold monitoring
- Automatic alerts when `quantity < min_quantity`
- Notifications sent to Inventory Manager
- Included in reorder reports

**6. Complete Audit Trail:**
- Every quantity change tracked in `spare_parts_inventory_transactions`
- Transaction type, quantity, user, timestamp, and reference information
- Unit cost tracking for accurate valuation
- Complete traceability for compliance and reporting

### 3.2. Comprehensive File Attachments System

**Purpose:** Flexible file attachment system for all entities with proper organization and access control.

**Key Features:**

**Attachments Table Structure:**
- `entity_type`: Type of entity (MAINTENANCE_REQUEST, MACHINE, SPARE_PART, etc.)
- `entity_id`: ID of the specific entity
- `file_url`: URL/path to the uploaded file
- `file_type`: File type (IMAGE, PDF, DOCUMENT, VIDEO, etc.)
- `uploaded_by`: User who uploaded the file
- `uploaded_at`: Timestamp of upload

**Supported Entity Types:**
- **MAINTENANCE_REQUEST**: Problem photos, before/after images, documentation
- **MACHINE**: Machine photos, manuals, specifications, technical documentation
- **SPARE_PART**: Part images, datasheets, installation guides, technical manuals
- **PREVENTIVE_MAINTENANCE**: Task photos, completion evidence
- **INVENTORY_TRANSACTION**: Receipt photos, delivery documentation

**File Management Features:**
- Multiple file uploads per entity
- File type validation and size limits
- Automatic file organization by entity
- Secure file storage with access control
- File preview and download capabilities
- Bulk file operations (upload, delete, organize)

**Integration with Workflows:**
- QR code problem reporting with photo attachments
- Maintenance work documentation with before/after photos
- Spare parts identification with part images
- Preventive maintenance task completion evidence
- Inventory transaction documentation

**File Types Supported:**
- **Images**: JPG, PNG, GIF for photos and diagrams
- **Documents**: PDF, DOC, DOCX for manuals, specifications, and reports
- **Manuals**: PDF, DOC, DOCX for technical manuals, user guides, installation instructions
- **Videos**: MP4, AVI for process documentation and training materials
- **Archives**: ZIP, RAR for bulk documentation and software packages

**Access Control:**
- Role-based file access permissions
- Entity-specific file visibility
- Audit trail for file uploads/downloads
- Secure file deletion with proper authorization

### 3.3. Manual and Documentation Management System

**Purpose:** Centralized management of technical manuals, specifications, and documentation for machines and spare parts.

**Key Features:**

**Manual Types Supported:**
- **Machine Manuals**: User guides, operation manuals, maintenance procedures
- **Spare Parts Manuals**: Installation guides, technical specifications, datasheets
- **Technical Documentation**: Engineering drawings, schematics, wiring diagrams
- **Training Materials**: Video tutorials, step-by-step procedures, safety guidelines
- **Compliance Documents**: Safety certificates, compliance reports, audit documentation

**Manual Management Features:**
- **Version Control**: Track different versions of manuals and documentation
- **Search and Filter**: Find manuals by machine, spare part, or document type
- **Access Control**: Role-based access to sensitive technical documentation
- **Download Tracking**: Monitor who downloads which manuals and when
- **Update Notifications**: Alert users when manuals are updated or replaced

**Integration with Workflows:**
- **Machine Setup**: Attach relevant manuals when adding new machines
- **Spare Parts Management**: Link installation guides and specifications to spare parts
- **Maintenance Procedures**: Reference manuals during maintenance work
- **Training**: Access training materials for technician education
- **Compliance**: Maintain required documentation for audits and inspections

**Manual Categories:**
- **OPERATION_MANUAL**: How to operate the machine safely and efficiently
- **MAINTENANCE_MANUAL**: Preventive and corrective maintenance procedures
- **INSTALLATION_GUIDE**: Step-by-step installation instructions
- **TECHNICAL_SPECIFICATION**: Detailed technical specifications and parameters
- **SAFETY_MANUAL**: Safety procedures and hazard information
- **TROUBLESHOOTING_GUIDE**: Common problems and solutions
- **PARTS_CATALOG**: Complete list of spare parts and components
- **WIRING_DIAGRAM**: Electrical schematics and connection diagrams

**Advanced Features:**
- **Manual Library**: Centralized repository of all technical documentation
- **Quick Access**: Direct links to manuals from machine and spare part pages
- **Offline Access**: Download manuals for offline use in the field
- **Multi-language Support**: Support for manuals in different languages
- **Interactive Manuals**: Support for interactive PDFs and multimedia content

**User Role Integration:**
- **Admin**: Full access to all manuals and documentation management
- **Maintenance Manager**: Access to maintenance and operation manuals
- **Technician**: Access to relevant manuals for assigned machines
- **Inventory Manager**: Access to spare parts specifications and installation guides
- **Supervisor**: Access to operation and safety manuals

### 3.4. Failure Codes Management System

**Purpose:** Standardized failure tracking and categorization for predictive maintenance analysis and pattern recognition.

**Key Features:**

**Failure Codes Table Structure:**
- `code`: Unique failure code identifier (e.g., "MECH001", "ELEC002")
- `description`: Detailed description of the failure type
- `category`: Failure category (MECHANICAL, ELECTRICAL, HYDRAULIC, PNEUMATIC, etc.)

**Standardized Failure Categories:**
- **MECHANICAL**: Bearings, belts, gears, couplings, alignment issues
- **ELECTRICAL**: Motor failures, wiring, controls, sensors, power issues
- **HYDRAULIC**: Pump failures, leaks, pressure issues, valve problems
- **PNEUMATIC**: Air leaks, pressure drops, valve malfunctions
- **THERMAL**: Overheating, cooling system failures, temperature issues
- **LUBRICATION**: Oil leaks, contamination, insufficient lubrication
- **VIBRATION**: Unbalance, misalignment, resonance issues
- **WEAR**: Normal wear, abnormal wear patterns, material degradation

**Integration with Maintenance Requests:**
- Link each maintenance request to specific failure code
- Enable failure pattern analysis across machines
- Track recurring failure types by machine/department
- Generate failure frequency reports

**Predictive Maintenance Benefits:**
- Identify machines with recurring failure patterns
- Predict maintenance needs based on failure history
- Optimize spare parts inventory based on failure types
- Schedule preventive maintenance before failures occur
- Analyze failure trends by category and machine type

**Failure Analysis Reports:**
- Most common failure types by machine/department
- Failure frequency trends over time
- Failure correlation analysis (which failures occur together)
- Mean time between failures (MTBF) by failure type
- Failure cost analysis and impact assessment

**Workflow Integration:**
- Supervisor selects failure code when reporting problems
- Technician confirms/updates failure code during diagnosis
- System automatically categorizes and tracks failure patterns
- Generate alerts for machines with increasing failure frequency

### 3.5. Maintenance Types Management System

**Purpose:** Categorize and distinguish between different types of maintenance activities for better planning, analysis, and resource allocation.

**Key Features:**

**Maintenance Types Table Structure:**
- `name`: Maintenance type name (Corrective, Preventive, Predictive, Inspection)
- `description`: Detailed description of the maintenance type and its purpose

**Standardized Maintenance Types:**

**1. CORRECTIVE (Emergency/Reactive Maintenance):**
- **Description**: Reactive maintenance performed after equipment failure or breakdown
- **Characteristics**: Unplanned, urgent, high priority, immediate response required
- **Examples**: Emergency repairs, breakdown fixes, urgent replacements
- **Workflow**: Problem reported → Immediate response → Emergency repair → Documentation

**2. PREVENTIVE (Scheduled Maintenance):**
- **Description**: Proactive maintenance performed on a scheduled basis to prevent failures
- **Characteristics**: Planned, scheduled, routine, time-based or usage-based
- **Examples**: Regular inspections, lubrication, cleaning, scheduled replacements
- **Workflow**: Schedule creation → Planned execution → Completion → Next schedule update

**3. PREDICTIVE (Condition-Based Maintenance):**
- **Description**: Maintenance based on equipment condition monitoring and data analysis
- **Characteristics**: Data-driven, condition-based, optimized timing, advanced analytics
- **Examples**: Vibration analysis, thermal imaging, oil analysis, sensor-based monitoring
- **Workflow**: Data collection → Analysis → Condition assessment → Maintenance scheduling

**4. INSPECTION (Assessment Maintenance):**
- **Description**: Systematic examination and assessment of equipment condition
- **Characteristics**: Assessment-focused, documentation-heavy, evaluation-oriented
- **Examples**: Safety inspections, compliance checks, condition assessments, audits
- **Workflow**: Inspection scheduling → Assessment execution → Report generation → Action planning

**Integration with Maintenance Requests:**
- Link each maintenance request to specific maintenance type
- Enable maintenance type analysis and reporting
- Track maintenance effectiveness by type
- Optimize resource allocation based on maintenance type patterns

**Maintenance Type Analysis Benefits:**
- **Resource Planning**: Allocate technicians and resources based on maintenance type requirements
- **Cost Analysis**: Track costs by maintenance type (corrective vs preventive cost comparison)
- **Efficiency Metrics**: Measure effectiveness of different maintenance strategies
- **Trend Analysis**: Identify shifts from corrective to preventive maintenance
- **ROI Calculation**: Calculate return on investment for preventive vs corrective maintenance

**Maintenance Type Reports:**
- Maintenance requests distribution by type
- Cost analysis by maintenance type
- Effectiveness comparison between maintenance types
- Trend analysis showing shift from reactive to proactive maintenance
- Resource utilization by maintenance type
- Mean time between maintenance by type

**Workflow Integration:**
- Supervisor selects maintenance type when reporting issues
- System automatically categorizes maintenance requests
- Generate reports and analytics by maintenance type
- Optimize maintenance scheduling based on type requirements
- Track maintenance strategy effectiveness over time

### 3.6. Machine-Specific Spare Parts Management System

**Purpose:** Define and manage spare parts requirements for each machine with machine-specific min/max quantities and availability tracking.

**Key Features:**

**Machine Spare Parts Table Structure:**
- `machine_id`: Foreign key to machines table
- `spare_part_id`: Foreign key to spare_parts table
- `min_qty`: Minimum quantity required for this specific machine
- `max_qty`: Maximum quantity recommended for this specific machine (optional)
- `created_at`: Timestamp when the relationship was established

**Database Relationships:**
- **Many-to-Many**: One machine can have multiple spare parts, one spare part can be used by multiple machines
- **Foreign Key Constraints**: 
  - `machine_id` → `machines.id` (CASCADE DELETE)
  - `spare_part_id` → `spare_parts.id` (CASCADE DELETE)
- **Unique Constraint**: `(machine_id, spare_part_id)` to prevent duplicate relationships

**Machine-Specific Inventory Management:**
- **Per-Machine Requirements**: Define different min/max quantities for the same spare part across different machines
- **Availability Tracking**: Check spare parts availability for specific machines
- **Replenishment Alerts**: Generate alerts when machine-specific spare parts fall below minimum
- **Usage Optimization**: Track which spare parts are actually used by each machine

**Key Benefits:**
- **Machine-Specific Planning**: Different machines may require different quantities of the same spare part
- **Optimized Inventory**: Avoid overstocking by setting machine-specific maximum quantities
- **Targeted Alerts**: Get alerts only for spare parts relevant to specific machines
- **Usage Analytics**: Track spare parts consumption patterns per machine
- **Maintenance Planning**: Plan spare parts requirements for machine maintenance schedules

**Workflow Integration:**
- **Machine Setup**: When adding a new machine, define its spare parts requirements
- **Maintenance Requests**: Show only relevant spare parts for the specific machine
- **Inventory Alerts**: Generate alerts when machine-specific spare parts are low
- **Preventive Maintenance**: Include spare parts requirements in preventive maintenance schedules

**Advanced Features:**
- **Cross-Machine Analysis**: Identify spare parts used by multiple machines
- **Consolidated Orders**: Group spare parts orders for multiple machines
- **Usage Patterns**: Analyze which spare parts are most critical for each machine
- **Cost Allocation**: Track spare parts costs per machine for maintenance cost analysis

**API Endpoints:**
- `GET /api/machines/{id}/spare-parts` - Get all spare parts for a specific machine
- `GET /api/spare-parts/{id}/machines` - Get all machines that use a specific spare part
- `POST /api/machine-spare-parts` - Create machine-spare part relationship
- `PUT /api/machine-spare-parts/{id}` - Update min/max quantities
- `DELETE /api/machine-spare-parts/{id}` - Remove relationship

**Database Schema (Prisma):**
```prisma
model MachineSparePart {
  id          Int      @id @default(autoincrement())
  machineId   Int
  sparePartId Int
  minQty      Int      @default(0)
  maxQty      Int?
  createdAt   DateTime @default(now())
  
  machine     Machine  @relation(fields: [machineId], references: [id], onDelete: Cascade)
  sparePart   SparePart @relation(fields: [sparePartId], references: [id], onDelete: Cascade)
  
  @@unique([machineId, sparePartId])
  @@map("machine_spare_parts")
}

model Machine {
  id          Int      @id @default(autoincrement())
  // ... existing fields
  spareParts  MachineSparePart[]
}

model SparePart {
  id          Int      @id @default(autoincrement())
  // ... existing fields
  machines    MachineSparePart[]
}
```

**SQL Schema:**
```sql
CREATE TABLE machine_spare_parts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_id INT NOT NULL,
  spare_part_id INT NOT NULL,
  min_qty INT NOT NULL DEFAULT 0,
  max_qty INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_machine_spare_part (machine_id, spare_part_id)
);
```

### 4. Analytics & Reporting (Basic + Future Predictive)

**Phase 1 - Basic Reports:**

- Machine downtime by machine/department/time period
- Spare parts consumption trends
- Most frequent machine problems
- Average repair time by machine type
- Maintenance request status overview
- Inventory stock levels and valuation reports
- Spare parts movement reports (in/out transactions)
- Low stock alerts and reorder recommendations
- Cost analysis by maintenance request or machine
- Inventory turnover rates by part group
- Failure analysis reports by category and frequency
- Most common failure types by machine/department
- Failure pattern recognition and trend analysis
- Mean time between failures (MTBF) by failure type
- Maintenance type distribution and effectiveness analysis
- Cost comparison between corrective vs preventive maintenance
- Maintenance strategy ROI analysis and optimization
- Resource utilization by maintenance type
- Machine-specific spare parts requirements and availability
- Cross-machine spare parts usage analysis
- Spare parts criticality analysis per machine
- Machine maintenance cost analysis including spare parts

**Phase 2 - Predictive Analytics (Future):**

- Predict maintenance needs based on historical data
- Identify machines with recurring issues
- Forecast spare parts requirements
- Recommend preventive maintenance schedules
- Failure prediction based on failure code patterns
- Machine health scoring using failure frequency analysis
- Predictive failure alerts before breakdowns occur
- Optimize maintenance schedules based on failure trends
- Maintenance type optimization recommendations
- Predictive maintenance scheduling based on condition data
- Maintenance strategy effectiveness prediction
- Resource allocation optimization by maintenance type

### 5. Responsive Design

- Mobile-optimized for QR scanning and field work
- Desktop-friendly for managers and inventory
- Progressive Web App capabilities for offline access

### 6. Activity Logs & Audit Trail System

**Purpose:** Track all critical user actions for security, compliance, and debugging.

**Implementation:**

- Automatic logging for create, update, delete operations
- Track user actions: login, logout, approval/rejection decisions
- Store entity changes with before/after values (JSON format)
- Include user ID, IP address, user agent for security audits
- API endpoint to query logs with filters (user, date range, entity type)

**Helper Function (`/lib/audit.ts`):**
```typescript
logActivity({
  userId: number,
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "LOGIN",
  entityType: string,
  entityId: number,
  description: string,
  changes?: object
})
```

**Features:**

- View all activity logs (Admin only)
- Filter by user, action type, date range
- Export logs to CSV for compliance
- Search by entity type and ID
- Track spare parts approvals/rejections
- Monitor maintenance request status changes

**Dashboard:** Activity timeline view for each entity (machine, request, etc.)

### 7. Preventive Maintenance Management

**Purpose:** Schedule and track recurring maintenance tasks to prevent equipment failure.

**Implementation:**

**Preventive Maintenance Tasks:**
- Create recurring maintenance schedules per machine
- Set frequency: Daily, Weekly, Monthly, Quarterly, Yearly
- Assign tasks to specific technicians
- Define task steps and instructions
- Track next due date and last completion
- Status: ACTIVE, PAUSED, COMPLETED

**Preventive Maintenance Logs:**
- Record completion of each scheduled task
- Store completion date, technician notes
- Link to maintenance_requests for urgent issues found
- Calculate next due date automatically

**Workflow:**

1. Admin/Maintenance Manager creates preventive task
2. System shows upcoming tasks on dashboard
3. Technician receives notification for due tasks
4. Technician completes task and logs completion
5. System updates next due date
6. If issues found during preventive check, create urgent maintenance request

**Features:**

- Calendar view of scheduled preventive maintenance
- Reminder notifications for upcoming tasks
- History of all preventive maintenance performed
- Integration with reactive maintenance (convert findings to requests)
- Filter by machine, technician, due date
- Bulk reschedule or pause tasks

**Dashboard:** Upcoming preventive maintenance list with due date countdown

### 8. Automatic Machine Downtime Tracking

**Purpose:** Automatically calculate actual downtime duration without manual end time entry.

**Enhanced Implementation:**

**Automatic Downtime Calculation:**

1. **Start Downtime:** Triggered when maintenance request status changes to IN_PROGRESS
   - Set `start_time` automatically
   - `auto_calculated` flag = true

2. **End Downtime:** Automatically calculated when:
   - Technician completes work (status: COMPLETED)
   - Use `maintenance_work.completed_at` timestamp
   - Calculate `duration_minutes` automatically
   - Set `end_time` = `completed_at`

3. **Manual Override:**
   - Allow manual entry for special cases
   - Flag as `auto_calculated` = false
   - Include reason for manual override in notes

**Improvements:**

- Track downtime for waiting parts (WAITING_PARTS status)
- Calculate total downtime including waiting periods
- Report shows breakdown: repair time vs waiting for parts time
- Alert management if downtime exceeds thresholds
- Export downtime reports for analysis

**API Enhancement:**

```typescript
// Auto-calculate downtime on status change
if (request.status === 'COMPLETED') {
  updateDowntimeEndTime(requestId, endTime, autoCalculated: true)
}
```

**Dashboard:**

- Real-time downtime counter
- Machine efficiency metrics
- Downtime comparison by machine/department
- Historical downtime trends

## Implementation Structure

```
/app
  /api
    /auth
    /machines
    /maintenance-requests
    /spare-parts
    /inventory-transactions
    /inventory-reports
    /attachments
    /failure-codes
    /maintenance-types
    /machine-spare-parts
    /reports
    /activity-logs
    /preventive-maintenance
    /downtime
    /qr-machines        # Get machine by QR code
  /admin
  /supervisor
  /technician
  /manager
  /inventory
  /dashboard
/components
  /qr-scanner
  /qr-scanner-technician
  /forms
  /tables
  /charts
  /audit-log-viewer
  /preventive-maintenance-calendar
  /inventory-management
  /inventory-reports
  /stock-movements
  /file-attachments
  /file-upload
  /manual-management
  /documentation-library
  /failure-codes
  /failure-analysis
  /maintenance-types
  /maintenance-analysis
  /machine-spare-parts
  /machine-inventory
/lib
  /prisma
  /auth
  /utils
  /audit.ts          # Activity logging helper
  /downtime.ts       # Automatic downtime calculation
  /inventory.ts      # Inventory management helper functions
/prisma
  schema.prisma
docker-compose.yml
```

## Approval Flow Summary

1. **Spare Parts**: Maintenance Manager approves spare parts requests → Inventory Manager issues parts

## New Features Summary (v2.0)

### 🔹 1. Activity Logs & Audit Trail
- **Purpose**: Track all critical user actions for compliance and security
- **Key Features**:
  - Automatic logging on create, update, delete operations
  - Track approvals/rejections, logins, and status changes
  - Store before/after values for entity changes
  - Include IP address and user agent for security audits
  - Filterable and exportable audit reports
- **Database**: `activity_logs` table with full audit metadata
- **Helper**: `/lib/audit.ts` with `logActivity()` function

### 🔹 2. Preventive Maintenance Management
- **Purpose**: Schedule recurring maintenance to prevent failures
- **Key Features**:
  - Create recurring tasks (Daily, Weekly, Monthly, Quarterly, Yearly)
  - Calendar view of scheduled maintenance
  - Automatic next due date calculation
  - Notifications for upcoming tasks
  - Convert findings to urgent maintenance requests
- **Database**: `preventive_maintenance_tasks` and `preventive_maintenance_logs` tables
- **Workflow**: Create task → Schedule → Notify → Complete → Auto-reschedule

### 🔹 3. Automatic Downtime Tracking Enhancement
- **Purpose**: Eliminate manual downtime entry with automatic calculation
- **Key Features**:
  - Auto-start downtime when maintenance begins (IN_PROGRESS status)
  - Auto-end downtime when work completes (COMPLETED status)
  - Automatic duration calculation
  - Manual override option for special cases
  - Track waiting-for-parts time separately
- **Database**: Added `auto_calculated` flag to `machine_downtime` table
- **Enhancement**: API automatically updates downtime based on maintenance status changes

### 🔹 4. Comprehensive Inventory Management
- **Purpose**: Complete inventory tracking with in/out movements, reporting, and analytics
- **Key Features**:
  - Track all inventory transactions (IN/OUT/ADJUSTMENT/TRANSFER)
  - Real-time stock levels with automatic updates
  - Comprehensive inventory reports and analytics
  - Purchase management and supplier tracking
  - Low stock alerts and reorder recommendations
  - Cost analysis and valuation reports
  - Group-based inventory organization
- **Database**: `spare_parts_inventory_transactions` table for complete audit trail
- **Components**: Inventory management, reports, and stock movement interfaces

### 🔹 5. Comprehensive File Attachments System
- **Purpose**: Flexible file attachment system for all entities with proper organization and access control
- **Key Features**:
  - Universal attachments table supporting all entity types
  - Multiple file types: Images, Documents, Videos, Archives
  - Role-based access control and file permissions
  - Integration with all workflows (maintenance, inventory, preventive)
  - File preview, download, and bulk operations
  - Secure file storage with audit trail
- **Database**: `attachments` table with entity_type/entity_id relationships
- **Components**: File upload, attachments management, and file preview interfaces

### 🔹 6. Manual and Documentation Management System
- **Purpose**: Centralized management of technical manuals, specifications, and documentation for machines and spare parts
- **Key Features**:
  - Comprehensive manual types: Operation, Maintenance, Installation, Safety, Technical specs
  - Version control and update notifications for documentation
  - Role-based access control for sensitive technical documentation
  - Integration with machine and spare parts workflows
  - Manual library with search and filter capabilities
  - Offline access and multi-language support
- **Database**: Uses existing `attachments` table with enhanced file type categorization
- **Components**: Manual management, documentation library, and technical document interfaces

### 🔹 7. Failure Codes Management System
- **Purpose**: Standardized failure tracking and categorization for predictive maintenance analysis
- **Key Features**:
  - Standardized failure codes with categories (MECHANICAL, ELECTRICAL, HYDRAULIC, etc.)
  - Integration with maintenance requests for failure tracking
  - Failure pattern analysis and trend recognition
  - Predictive maintenance insights based on failure history
  - Failure frequency reports and MTBF analysis
  - Machine health scoring using failure data
- **Database**: `failure_codes` table linked to `maintenance_requests.failure_code_id`
- **Components**: Failure codes management, failure analysis, and predictive insights interfaces

### 🔹 8. Maintenance Types Management System
- **Purpose**: Categorize and distinguish between different types of maintenance activities for better planning and analysis
- **Key Features**:
  - Four main maintenance types: Corrective, Preventive, Predictive, Inspection
  - Integration with maintenance requests for type-based analysis
  - Maintenance strategy effectiveness comparison and ROI analysis
  - Resource allocation optimization by maintenance type
  - Cost analysis and trend reporting by maintenance type
  - Maintenance strategy optimization recommendations
- **Database**: `maintenance_types` table linked to `maintenance_requests.maintenance_type_id`
- **Components**: Maintenance types management, maintenance analysis, and strategy optimization interfaces

### 🔹 9. Machine-Specific Spare Parts Management System
- **Purpose**: Define and manage spare parts requirements for each machine with machine-specific quantities and availability tracking
- **Key Features**:
  - Many-to-many relationship between machines and spare parts
  - Machine-specific min/max quantities for each spare part
  - Cross-machine spare parts usage analysis and optimization
  - Targeted inventory alerts for machine-specific spare parts
  - Usage pattern analysis and cost allocation per machine
  - Consolidated ordering and inventory optimization
- **Database**: `machine_spare_parts` table with unique constraints and foreign keys
- **Components**: Machine-spare parts management, machine inventory, and cross-machine analysis interfaces

## Key Technical Decisions

- Use Prisma for type-safe database queries
- HTML5 camera API for QR scanning on mobile
- Cloudinary or local storage for photos
- Chart.js or Recharts for analytics visualization
- Real-time updates using React Query for data fetching
- Implement activity logging middleware for automatic audit trails
- Use Prisma hooks/transactions for automatic downtime calculation
- Cron job or background worker for preventive maintenance task reminders
- JSON field in database for storing activity log changes (flexible schema)