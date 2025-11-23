# Factory Maintenance Management System - Technical Architecture

## 📐 System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │         │
│  │   Browser    │  │   Browser    │  │   Browser    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│           │                 │                │                  │
│           └─────────────────┴────────────────┘                  │
│                          │                                      │
│                    HTTPS/WSS                                    │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │              Next.js 14 Application                        │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  App Router  │  React Components  │  Server Components   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                   API Routes Layer                         │ │
│  │  /api/auth  │  /api/machines  │  /api/maintenance  │ ... │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │              Business Logic Layer                          │ │
│  │  Authentication │ Authorization │ Validation │ Workflows  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                  Data Access Layer                         │ │
│  │                    Prisma ORM                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                      DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  MySQL Database  │    │  File Storage    │                  │
│  │   (Primary DB)   │    │ (S3/Cloudinary)  │                  │
│  └──────────────────┘    └──────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Docker Containers │ Nginx Reverse Proxy │ SSL/TLS             │
│  CI/CD Pipeline   │ Monitoring Tools    │ Backup Systems      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Application Architecture

### Frontend Architecture (Next.js 14)

```
app/
├── (auth)/                    # Public routes
│   ├── login/
│   └── register/
├── dashboard/                 # Main dashboard
├── admin/                     # Admin module
│   ├── users/
│   ├── departments/
│   ├── machines/
│   ├── spare-parts/
│   ├── failure-codes/
│   ├── maintenance-types/
│   └── activity-logs/
├── supervisor/                # Supervisor module
│   ├── qr-scanner/
│   ├── report-problem/
│   └── requests/
├── technician/                # Technician module
│   ├── qr-scanner/
│   ├── assigned-requests/
│   ├── work-form/
│   └── preventive-tasks/
├── manager/                   # Manager module
│   ├── requests/
│   ├── approvals/
│   ├── analytics/
│   └── reports/
├── inventory/                 # Inventory module
│   ├── spare-parts/
│   ├── transactions/
│   ├── issue-parts/
│   └── reports/
└── api/                       # API routes
    └── [endpoints]/
```

### Component Architecture

```
components/
├── ui/                        # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   └── toast.tsx
├── forms/                     # Form components
│   ├── machine-form.tsx
│   ├── maintenance-request-form.tsx
│   ├── maintenance-work-form.tsx
│   ├── spare-parts-form.tsx
│   └── preventive-task-form.tsx
├── tables/                    # Table components
│   ├── machines-table.tsx
│   ├── requests-table.tsx
│   ├── spare-parts-table.tsx
│   └── transactions-table.tsx
├── charts/                    # Chart components
│   ├── downtime-chart.tsx
│   ├── consumption-chart.tsx
│   ├── failure-chart.tsx
│   └── cost-chart.tsx
├── qr-scanner/                # QR scanner
│   ├── qr-scanner-component.tsx
│   └── qr-result-display.tsx
├── layouts/                   # Layout components
│   ├── main-layout.tsx
│   ├── dashboard-layout.tsx
│   └── auth-layout.tsx
├── file-upload/               # File upload
│   ├── file-uploader.tsx
│   ├── file-preview.tsx
│   └── file-list.tsx
└── notifications/             # Notifications
    ├── notification-bell.tsx
    └── notification-list.tsx
```

---

## 🗄️ Database Architecture

### Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    USERS    │
└──────┬──────┘
       │
       │ 1:N
       ├──────────┐
       │          │
       ▼          ▼
┌──────────────┐  ┌────────────────────┐
│ DEPARTMENTS  │  │ MAINTENANCE_REQUESTS│
└──────┬───────┘  └─────────┬──────────┘
       │                    │
       │ 1:N               │ 1:1
       ▼                    ▼
┌──────────────┐  ┌────────────────────┐
│   MACHINES   │  │ MAINTENANCE_WORK   │
└──────┬───────┘  └─────────┬──────────┘
       │                    │
       │ N:M               │ 1:N
       ├──────────┐         ▼
       │          │  ┌──────────────────────┐
       │          │  │ SPARE_PARTS_REQUESTS │
       │          │  └──────────┬───────────┘
       │          │             │
       │          │             │ 1:N
       ▼          ▼             ▼
┌───────────────────────┐  ┌──────────────┐
│ MACHINE_SPARE_PARTS   │  │ SPARE_PARTS  │
└───────────────────────┘  └──────┬───────┘
                                  │
                                  │ 1:N
                                  ▼
                    ┌──────────────────────────────┐
                    │ INVENTORY_TRANSACTIONS       │
                    └──────────────────────────────┘
```

### Database Schema Details

#### Core Tables

**users**
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'SUPERVISOR', 'MAINTENANCE_TECH', 
           'MAINTENANCE_MANAGER', 'INVENTORY_MANAGER') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

**machines**
```sql
CREATE TABLE machines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  serial_number VARCHAR(255),
  department_id INT NOT NULL,
  location VARCHAR(255),
  installation_date DATE,
  status ENUM('OPERATIONAL', 'DOWN', 'MAINTENANCE', 'DECOMMISSIONED') DEFAULT 'OPERATIONAL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (department_id) REFERENCES departments(id),
  INDEX idx_qr_code (qr_code),
  INDEX idx_department (department_id),
  INDEX idx_status (status)
);
```

**maintenance_requests**
```sql
CREATE TABLE maintenance_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_id INT NOT NULL,
  reporter_id INT NOT NULL,
  status ENUM('PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 
             'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  problem_description TEXT,
  failure_code_id INT,
  maintenance_type_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (machine_id) REFERENCES machines(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (failure_code_id) REFERENCES failure_codes(id),
  FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_machine (machine_id),
  INDEX idx_reported_at (reported_at)
);
```

**spare_parts**
```sql
CREATE TABLE spare_parts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  part_number VARCHAR(255) UNIQUE NOT NULL,
  part_name VARCHAR(255) NOT NULL,
  description TEXT,
  group_number VARCHAR(100),
  group_name VARCHAR(255),
  quantity INT NOT NULL DEFAULT 0,
  min_quantity INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_part_number (part_number),
  INDEX idx_group (group_number),
  INDEX idx_quantity (quantity),
  INDEX idx_min_quantity (min_quantity)
);
```

**spare_parts_inventory_transactions**
```sql
CREATE TABLE spare_parts_inventory_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  spare_part_id INT NOT NULL,
  transaction_type ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER') NOT NULL,
  quantity INT NOT NULL,
  reference_type ENUM('PURCHASE', 'MAINTENANCE', 'ADJUSTMENT', 'TRANSFER'),
  reference_id INT,
  performed_by INT NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  unit_cost DECIMAL(10,2),
  
  FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id),
  FOREIGN KEY (performed_by) REFERENCES users(id),
  INDEX idx_spare_part (spare_part_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_transaction_date (transaction_date)
);
```

---

## 🔌 API Architecture

### RESTful API Endpoints

#### Authentication & Authorization

```typescript
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register
GET    /api/auth/me
POST   /api/auth/refresh
```

#### User Management

```typescript
GET    /api/users              // List all users (Admin)
GET    /api/users/:id          // Get user details
POST   /api/users              // Create user (Admin)
PUT    /api/users/:id          // Update user
DELETE /api/users/:id          // Delete user (Admin)
GET    /api/users/me           // Get current user
PUT    /api/users/me/password  // Change password
```

#### Department Management

```typescript
GET    /api/departments         // List all departments
GET    /api/departments/:id     // Get department details
POST   /api/departments         // Create department (Admin)
PUT    /api/departments/:id     // Update department
DELETE /api/departments/:id     // Delete department
```

#### Machine Management

```typescript
GET    /api/machines                    // List all machines
GET    /api/machines/:id                // Get machine details
POST   /api/machines                    // Create machine
PUT    /api/machines/:id                // Update machine
DELETE /api/machines/:id                // Delete machine
GET    /api/machines/:id/history        // Get machine history
GET    /api/machines/:id/qr-code        // Get QR code
GET    /api/qr-machines/:qrCode         // Get machine by QR code
GET    /api/machines/:id/spare-parts    // Get machine's spare parts
POST   /api/machines/:id/spare-parts    // Assign spare part to machine
DELETE /api/machines/:id/spare-parts/:sparePartId  // Remove assignment
```

#### Maintenance Requests

```typescript
GET    /api/maintenance-requests              // List all requests
GET    /api/maintenance-requests/:id          // Get request details
POST   /api/maintenance-requests              // Create request
PUT    /api/maintenance-requests/:id          // Update request
PATCH  /api/maintenance-requests/:id/status   // Update status
DELETE /api/maintenance-requests/:id          // Delete request
GET    /api/maintenance-requests/:id/history  // Get request history
GET    /api/maintenance-requests/assigned     // Get assigned requests (Technician)
GET    /api/maintenance-requests/department/:deptId  // Get dept requests (Supervisor)
```

#### Maintenance Work

```typescript
GET    /api/maintenance-work                 // List all work
GET    /api/maintenance-work/:id             // Get work details
POST   /api/maintenance-work                 // Create work
PUT    /api/maintenance-work/:id             // Update work
DELETE /api/maintenance-work/:id             // Delete work
POST   /api/maintenance-work/:id/complete    // Complete work
```

#### Spare Parts Management

```typescript
GET    /api/spare-parts              // List all spare parts
GET    /api/spare-parts/:id          // Get spare part details
POST   /api/spare-parts              // Create spare part
PUT    /api/spare-parts/:id          // Update spare part
DELETE /api/spare-parts/:id          // Delete spare part
GET    /api/spare-parts/low-stock    // Get low stock parts
GET    /api/spare-parts/:id/machines // Get machines using this part
POST   /api/spare-parts/bulk-import  // Bulk import parts (CSV)
```

#### Spare Parts Requests

```typescript
GET    /api/spare-parts-requests              // List all requests
GET    /api/spare-parts-requests/:id          // Get request details
POST   /api/spare-parts-requests              // Create request
PUT    /api/spare-parts-requests/:id          // Update request
PATCH  /api/spare-parts-requests/:id/approve  // Approve request (Manager)
PATCH  /api/spare-parts-requests/:id/reject   // Reject request (Manager)
PATCH  /api/spare-parts-requests/:id/issue    // Issue parts (Inventory Mgr)
GET    /api/spare-parts-requests/pending-approval  // Pending approvals
GET    /api/spare-parts-requests/approved     // Approved requests to issue
```

#### Inventory Transactions

```typescript
GET    /api/inventory-transactions           // List all transactions
GET    /api/inventory-transactions/:id       // Get transaction details
POST   /api/inventory-transactions/in        // Record stock IN
POST   /api/inventory-transactions/out       // Record stock OUT
POST   /api/inventory-transactions/adjustment // Record adjustment
POST   /api/inventory-transactions/transfer  // Record transfer
GET    /api/inventory-transactions/spare-part/:id  // Get part transactions
```

#### Failure Codes

```typescript
GET    /api/failure-codes        // List all failure codes
GET    /api/failure-codes/:id    // Get failure code details
POST   /api/failure-codes        // Create failure code (Admin)
PUT    /api/failure-codes/:id    // Update failure code
DELETE /api/failure-codes/:id    // Delete failure code
```

#### Maintenance Types

```typescript
GET    /api/maintenance-types        // List all maintenance types
GET    /api/maintenance-types/:id    // Get maintenance type details
POST   /api/maintenance-types        // Create maintenance type (Admin)
PUT    /api/maintenance-types/:id    // Update maintenance type
DELETE /api/maintenance-types/:id    // Delete maintenance type
```

#### Preventive Maintenance

```typescript
GET    /api/preventive-maintenance/tasks           // List all tasks
GET    /api/preventive-maintenance/tasks/:id       // Get task details
POST   /api/preventive-maintenance/tasks           // Create task
PUT    /api/preventive-maintenance/tasks/:id       // Update task
DELETE /api/preventive-maintenance/tasks/:id       // Delete task
GET    /api/preventive-maintenance/tasks/upcoming  // Get upcoming tasks
POST   /api/preventive-maintenance/logs            // Log task completion
GET    /api/preventive-maintenance/logs/:taskId    // Get task logs
```

#### Activity Logs

```typescript
GET    /api/activity-logs              // List all logs (Admin)
GET    /api/activity-logs/:id          // Get log details
GET    /api/activity-logs/user/:userId // Get user's logs
GET    /api/activity-logs/entity/:type/:id  // Get entity logs
POST   /api/activity-logs/export       // Export logs to CSV
```

#### Analytics & Reports

```typescript
GET    /api/analytics/downtime              // Machine downtime analytics
GET    /api/analytics/consumption           // Spare parts consumption
GET    /api/analytics/failures              // Failure analysis
GET    /api/analytics/maintenance-types     // Maintenance type analysis
GET    /api/analytics/costs                 // Cost analysis
GET    /api/analytics/mtbf                  // Mean time between failures
GET    /api/analytics/dashboard             // Dashboard summary

GET    /api/reports/downtime                // Downtime report
GET    /api/reports/inventory               // Inventory report
GET    /api/reports/consumption             // Consumption report
GET    /api/reports/valuation               // Inventory valuation
GET    /api/reports/maintenance-efficiency  // Maintenance efficiency
GET    /api/reports/failure-analysis        // Failure analysis report
POST   /api/reports/export                  // Export report to PDF/Excel
```

#### File Attachments

```typescript
POST   /api/attachments/upload         // Upload file(s)
GET    /api/attachments/:id            // Get attachment details
GET    /api/attachments/entity/:type/:id  // Get entity attachments
DELETE /api/attachments/:id            // Delete attachment
GET    /api/attachments/:id/download   // Download file
```

---

## 🔐 Security Architecture

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└─────┬────┘                                    └─────┬────┘
      │                                               │
      │  POST /api/auth/login                        │
      │  { email, password }                         │
      ├──────────────────────────────────────────────>
      │                                               │
      │                                        [Verify Credentials]
      │                                        [Generate JWT Token]
      │                                               │
      │  200 OK                                       │
      │  { token, user, refreshToken }                │
      <───────────────────────────────────────────────┤
      │                                               │
      │ [Store token in HTTP-only cookie             │
      │  or localStorage]                             │
      │                                               │
      │  GET /api/machines                            │
      │  Authorization: Bearer {token}                │
      ├──────────────────────────────────────────────>
      │                                               │
      │                                        [Verify JWT]
      │                                        [Check Permissions]
      │                                        [Fetch Data]
      │                                               │
      │  200 OK                                       │
      │  { data }                                     │
      <───────────────────────────────────────────────┤
      │                                               │
```

### Authorization Matrix

| Endpoint | Admin | Supervisor | Technician | Manager | Inv. Mgr |
|----------|-------|------------|------------|---------|----------|
| `/api/users` | CRUD | - | - | R | - |
| `/api/departments` | CRUD | R | R | R | R |
| `/api/machines` | CRUD | R | R | R | R |
| `/api/maintenance-requests` (create) | C | C | - | - | - |
| `/api/maintenance-requests` (view all) | R | Dept | Assigned | R | R |
| `/api/maintenance-work` | R | - | CRUD | R | R |
| `/api/spare-parts-requests` (create) | - | - | C | - | - |
| `/api/spare-parts-requests` (approve) | - | - | - | U | - |
| `/api/spare-parts` | CRUD | R | R | R | CRUD |
| `/api/inventory-transactions` | R | - | - | R | CRUD |
| `/api/activity-logs` | R | - | - | - | - |

**Legend**: C=Create, R=Read, U=Update, D=Delete, Dept=Department only, Assigned=Assigned to user only

### Security Measures

1. **Authentication**
   - JWT tokens with short expiration (15 minutes)
   - Refresh tokens with longer expiration (7 days)
   - HTTP-only cookies for token storage
   - Secure flag for HTTPS

2. **Authorization**
   - Role-based access control (RBAC)
   - Middleware for route protection
   - Resource-level permissions

3. **Data Protection**
   - Password hashing with bcrypt (salt rounds: 10)
   - Input validation with Zod
   - SQL injection prevention (Prisma ORM)
   - XSS protection (sanitize inputs)
   - CSRF tokens for state-changing operations

4. **API Security**
   - Rate limiting (100 requests/15 minutes)
   - CORS configuration
   - Security headers (Helmet.js)
   - API versioning

5. **File Upload Security**
   - File type validation
   - File size limits (10MB per file)
   - Virus scanning (optional)
   - Secure file storage with access control

---

## 📦 Data Flow Architecture

### Maintenance Request Workflow

```
┌────────────┐
│ Supervisor │
│  (Mobile)  │
└─────┬──────┘
      │ 1. Scan QR Code
      ▼
┌────────────────────┐
│  GET /api/qr-      │
│  machines/{code}   │
└─────┬──────────────┘
      │ 2. Get Machine Info
      ▼
┌────────────────────┐
│ POST /api/         │
│ maintenance-       │
│ requests           │
└─────┬──────────────┘
      │ 3. Create Request (PENDING)
      │ 4. Upload Photos
      ▼
┌────────────────────┐
│   Database         │
│ + Notifications    │
└─────┬──────────────┘
      │ 5. Notify Technician
      ▼
┌────────────────────┐
│  Technician        │
│  Dashboard         │
└─────┬──────────────┘
      │ 6. Accept Request
      ▼
┌────────────────────┐
│ PATCH /api/        │
│ maintenance-       │
│ requests/:id/      │
│ status             │
└─────┬──────────────┘
      │ 7. Status: IN_PROGRESS
      │ 8. Start Downtime Tracking
      ▼
┌────────────────────┐
│ POST /api/         │
│ maintenance-work   │
└─────┬──────────────┘
      │ 9. Record Work Steps
      │ 10. Request Spare Parts (if needed)
      ▼
┌────────────────────┐
│ POST /api/spare-   │
│ parts-requests     │
└─────┬──────────────┘
      │ 11. Status: WAITING_PARTS
      │ 12. Notify Manager
      ▼
┌────────────────────┐
│  Manager Approval  │
└─────┬──────────────┘
      │ 13. Approve/Reject
      ▼
┌────────────────────┐
│ PATCH /api/spare-  │
│ parts-requests/    │
│ :id/approve        │
└─────┬──────────────┘
      │ 14. Notify Inventory Manager
      ▼
┌────────────────────┐
│  Inventory Mgr     │
│  Issues Parts      │
└─────┬──────────────┘
      │ 15. Issue Parts
      ▼
┌────────────────────┐
│ PATCH /api/spare-  │
│ parts-requests/    │
│ :id/issue          │
│                    │
│ POST /api/         │
│ inventory-         │
│ transactions/out   │
└─────┬──────────────┘
      │ 16. Deduct Quantity
      │ 17. Record Transaction
      │ 18. Notify Technician
      ▼
┌────────────────────┐
│  Technician        │
│  Completes Work    │
└─────┬──────────────┘
      │ 19. Complete Work
      ▼
┌────────────────────┐
│ POST /api/         │
│ maintenance-work/  │
│ :id/complete       │
└─────┬──────────────┘
      │ 20. Status: COMPLETED
      │ 21. End Downtime Tracking
      │ 22. Calculate Duration
      ▼
┌────────────────────┐
│   Database         │
│ + Activity Logs    │
└────────────────────┘
```

### Inventory Quantity Update Flow

```
┌────────────────────┐
│  Inventory Manager │
└─────┬──────────────┘
      │
      ▼
┌────────────────────────────────────┐
│  Action: Issue Parts for           │
│  Maintenance (OUT)                 │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ POST /api/spare-parts-requests/    │
│ :id/issue                          │
│                                    │
│ Body: { quantityIssued: 5 }        │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 1. Validate Request Status         │
│    (Must be APPROVED)               │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 2. Check Spare Part Availability   │
│    currentQty >= quantityIssued?   │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 3. Create Inventory Transaction    │
│    transaction_type: OUT           │
│    quantity: 5                     │
│    reference_type: MAINTENANCE     │
│    reference_id: request_id        │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 4. Update Spare Part Quantity      │
│    newQty = currentQty - 5         │
│    UPDATE spare_parts              │
│    SET quantity = newQty           │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 5. Update Request Status           │
│    status = ISSUED                 │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 6. Create Spare Parts Usage        │
│    Record actual usage             │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 7. Check if Low Stock              │
│    if (newQty < min_quantity)      │
│    → Create Alert                  │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 8. Log Activity                    │
│    action: ISSUE_PARTS             │
│    entity: SPARE_PARTS_REQUEST     │
└─────┬──────────────────────────────┘
      │
      ▼
┌────────────────────────────────────┐
│ 9. Return Success Response         │
│    + Updated quantity              │
│    + Transaction details           │
└────────────────────────────────────┘
```

---

## 🚀 Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────────────────────┐
│                         INTERNET                              │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   CloudFlare   │
                    │   DNS + CDN    │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Load Balancer │
                    │  (Optional)    │
                    └────────┬───────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    APPLICATION SERVER                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Nginx Reverse Proxy                     │  │
│  │              SSL/TLS Termination                     │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │                                    │
│                       ▼                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Docker Container: Next.js App                │  │
│  │         Port: 3000                                   │  │
│  └────────────────────┬────────────────────────────────┘  │
│                       │                                    │
└───────────────────────┼────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│                    DATABASE SERVER                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         Docker Container: MySQL 8.0                  │  │
│  │         Port: 3306                                   │  │
│  │         + Daily Automated Backups                    │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│                    FILE STORAGE                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         AWS S3 / Cloudinary                          │  │
│  │         Uploaded Files (Photos, Manuals, etc.)       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline (GitHub Actions)

```
┌──────────────┐
│  Developer   │
│  Push Code   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│          GitHub Repository                   │
│          main / develop branch               │
└──────┬──────────────────────────────────────┘
       │ Trigger
       ▼
┌─────────────────────────────────────────────┐
│          GitHub Actions Workflow             │
├─────────────────────────────────────────────┤
│                                              │
│  Step 1: Checkout Code                      │
│  Step 2: Install Dependencies                │
│  Step 3: Run Linter (ESLint)                │
│  Step 4: Run Type Check (TypeScript)        │
│  Step 5: Run Unit Tests (Jest)              │
│  Step 6: Build Application                  │
│  Step 7: Build Docker Image                 │
│  Step 8: Push to Container Registry         │
│                                              │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│       Deploy to Staging (Auto)              │
│       Run Smoke Tests                        │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│       Manual Approval Required               │
│       (Production Deployment)                │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│       Deploy to Production                   │
│       - Pull Docker Image                    │
│       - Run Database Migrations              │
│       - Start New Container                  │
│       - Health Check                         │
│       - Switch Traffic (Zero Downtime)       │
└──────┬──────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│       Post-Deployment                        │
│       - Send Slack Notification              │
│       - Monitor Error Rates (Sentry)         │
│       - Alert on Issues                      │
└─────────────────────────────────────────────┘
```

---

## 🔍 Monitoring & Logging

### Application Monitoring

```
Application Metrics:
├── Response Times (API endpoints)
├── Error Rates (4xx, 5xx)
├── Request Volume
├── Database Query Performance
└── Memory & CPU Usage

Infrastructure Metrics:
├── Server Uptime
├── Database Connections
├── Disk Usage
├── Network I/O
└── Container Health

Business Metrics:
├── Active Users
├── Maintenance Requests Created
├── Average Resolution Time
├── Spare Parts Consumption
└── Machine Downtime
```

### Error Tracking (Sentry)

```typescript
// Configure Sentry
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Track errors
try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### Logging Strategy

```typescript
// Use Winston or Pino for structured logging

import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log levels:
// - error: Critical errors
// - warn: Warning conditions
// - info: Informational messages
// - debug: Debug messages

logger.info('Maintenance request created', {
  requestId: 123,
  machineId: 456,
  userId: 789
});
```

---

## 📊 Performance Optimization

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_machine ON maintenance_requests(machine_id);
CREATE INDEX idx_maintenance_requests_date ON maintenance_requests(reported_at);

CREATE INDEX idx_spare_parts_quantity ON spare_parts(quantity);
CREATE INDEX idx_spare_parts_group ON spare_parts(group_number);

CREATE INDEX idx_transactions_spare_part ON spare_parts_inventory_transactions(spare_part_id);
CREATE INDEX idx_transactions_date ON spare_parts_inventory_transactions(transaction_date);

-- Composite indexes
CREATE INDEX idx_requests_machine_status ON maintenance_requests(machine_id, status);
CREATE INDEX idx_parts_group_quantity ON spare_parts(group_number, quantity);
```

### Caching Strategy

```typescript
// Use React Query for client-side caching
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['machines'],
  queryFn: fetchMachines,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Server-side caching for static data
// - Failure codes
// - Maintenance types
// - Department list
```

### Code Splitting

```typescript
// Dynamic imports for large components
const QRScanner = dynamic(() => import('@/components/qr-scanner'), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

const AnalyticsDashboard = dynamic(() => import('@/components/analytics'), {
  loading: () => <LoadingSkeleton />
});
```

---

## 🔒 Backup & Recovery

### Backup Strategy

```
Daily Backups:
├── Database Full Backup (2:00 AM)
│   └── Retention: 30 days
├── Incremental Backup (Every 6 hours)
│   └── Retention: 7 days
└── File Storage Backup
    └── Retention: 30 days

Weekly Backups:
└── Full System Backup
    └── Retention: 90 days

Monthly Backups:
└── Archive Backup
    └── Retention: 1 year
```

### Disaster Recovery Plan

```
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 6 hours

Recovery Steps:
1. Provision new server
2. Restore latest database backup
3. Deploy Docker containers
4. Restore file storage
5. Update DNS records
6. Verify functionality
7. Monitor for issues
```

---

**Document Version**: 1.0  
**Last Updated**: October 26, 2025  
**Maintained By**: Development Team

