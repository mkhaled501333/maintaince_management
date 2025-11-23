# Factory Maintenance Management Web Application - Fullstack Architecture

Version: 1.0  
Last Updated: 2024-01-XX  
Architect: Winston

## Document Purpose

This document outlines the complete fullstack architecture for the Factory Maintenance Management Web Application, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial architecture document | Winston (Architect) |

---

## High Level Architecture

### Technical Summary

The Factory Maintenance Management Web Application is built as a **modern fullstack application** with a **FastAPI backend** and **Next.js 14 frontend**. The application leverages a **monorepo structure** with shared types and API clients to maintain consistency between frontend and backend.

**Key Architectural Characteristics:**
- **Frontend:** Next.js 14 (App Router) with TypeScript, React, Tailwind CSS, and React Query for server state management
- **Backend:** FastAPI with Python, SQLAlchemy ORM for database interactions, and Pydantic for data validation
- **Database:** MySQL for reliable relational data with complex relationships
- **Key Integrations:** HTML5 camera API for mobile QR scanning, React Query for real-time updates, FastAPI WebSocket support for live updates
- **Infrastructure:** Docker for containerization, GitHub Actions for CI/CD, deployed on cloud platforms or self-hosted options
- **Architecture Style:** Microservices approach with separate frontend and backend services communicating via REST API

This architecture effectively supports the multi-role workflow requirements (Supervisors, Technicians, Managers) with real-time updates, comprehensive audit logging, and mobile-first QR code functionality while maintaining scalability and maintainability.

---

### Platform and Infrastructure Choice

**Recommendation:** Hybrid approach with Docker as primary deployment option

**Platform Options Considered:**

1. **Docker (On-Premise/Managed Kubernetes)**
   - ✅ Full control over infrastructure
   - ✅ Data residency compliance (important for factory data)
   - ✅ No per-user scaling costs
   - ✅ Aligns with existing IT infrastructure
   - ❌ Operational overhead for updates and scaling

2. **Vercel (Platform-as-a-Service)**
   - ✅ Seamless Next.js integration
   - ✅ Global CDN and edge functions
   - ✅ Zero-config deployment
   - ❌ Vendor lock-in
   - ❌ Pricing scales with usage
   - ❌ Limited database options

3. **AWS/Azure/GCP (Enterprise Cloud)**
   - ✅ Enterprise-grade scalability
   - ✅ Comprehensive service ecosystem
   - ✅ Advanced security and compliance
   - ❌ Higher complexity and cost
   - ❌ Steeper learning curve

**Final Decision:** Docker-based deployment as primary option, with cloud providers for enterprises requiring higher scale.

**Key Services:**
- **Container Runtime:** Docker
- **Orchestration:** Docker Compose (development/staging), Kubernetes (production)
- **Database:** MySQL 8.0 in containerized setup
- **File Storage:** Local filesystem for development, S3/MinIO for production
- **Monitoring:** Prometheus + Grafana
- **Logging:** Centralized logging with ELK stack or Loki

**Deployment Host and Regions:**
- Primary: On-premise or self-managed cloud
- Regions: Single region for initial deployment with multi-region support for future scalability

---

### Repository Structure

**Structure:** Simple project structure with separate frontend and backend applications

**Package Organization:**

```
maintaince_management/
├── frontend/                   # Next.js frontend application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── backend/                    # FastAPI backend application
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml          # Local development environment
└── README.md
```

**Rationale:**
- Clear separation between frontend and backend applications
- Simplified project structure for easier development and deployment
- Independent deployment of frontend and backend services
- Reduced complexity compared to monorepo approach

---

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WebApp[Next.js Web App<br/>TypeScript + React]
        Mobile[Mobile Browser<br/>QR Scanner]
    end
    
    subgraph "API Layer"
        FastAPI[FastAPI Backend<br/>Python + Pydantic]
        Middleware[Auth Middleware<br/>Rate Limiting]
    end
    
    subgraph "Business Logic Layer"
        Services[Business Services<br/>Maintenance, Inventory, Auth]
        SQLAlchemy[SQLAlchemy ORM<br/>Type-safe DB Access]
    end
    
    subgraph "Data Layer"
        MySQL[(MySQL Database<br/>Maintenance Data)]
        FileStorage[(File Storage<br/>Attachments & Images)]
    end
    
    subgraph "External Services"
        QRScanner[HTML5 Camera API]
        Notifications[Email/SMS<br/>Optional]
    end
    
    WebApp -->|HTTPS| FastAPI
    Mobile -->|HTTPS| FastAPI
    FastAPI --> Middleware
    Middleware --> Services
    Services --> SQLAlchemy
    SQLAlchemy --> MySQL
    Services --> FileStorage
    Mobile --> QRScanner
    Services -.->|Optional| Notifications
    
    style WebApp fill:#e1f5ff
    style Mobile fill:#e1f5ff
    style FastAPI fill:#fff4e1
    style Services fill:#f0f8e1
    style MySQL fill:#ffe1f5
```

---

### Architectural Patterns

**Microservices Architecture:** Separate frontend and backend services with API-driven communication
- **Rationale:** Independent scaling, technology flexibility, and clear separation of concerns between frontend and backend

**Component-Based UI:** Modular React components with TypeScript
- **Rationale:** Maintainability, reusability, and type safety across large codebases. Enables parallel development and easy testing

**Server-Side Rendering (SSR) + Static Site Generation (SSG):** Next.js hybrid rendering
- **Rationale:** Best of both worlds - fast initial page loads with SSR, optimal SEO with SSG, and dynamic updates where needed

**Repository Pattern:** Data access abstraction via SQLAlchemy
- **Rationale:** Clean separation between business logic and data access, enables easy database migrations and testing

**API-First Design:** FastAPI backend with comprehensive API documentation
- **Rationale:** Clear API contracts, automatic OpenAPI documentation, and easy integration testing

**Event-Driven Updates:** React Query for server state management
- **Rationale:** Automatic caching, background refetching, and optimistic updates provide real-time-like experience without WebSockets complexity

**Middleware Pattern:** Request processing pipeline
- **Rationale:** Centralized authentication, authorization, logging, and error handling across all API endpoints

**Audit Trail Pattern:** Automatic logging of all critical actions
- **Rationale:** Compliance, security monitoring, and debugging support with complete activity history

---

## Tech Stack

**CRITICAL:** This table is the single source of truth for all technology decisions. All development must use these exact versions.

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.x | Type-safe frontend development | Catch errors at compile time, better IDE support, improved maintainability |
| Frontend Framework | Next.js | 14.x (App Router) | Fullstack React framework | Modern App Router, built-in optimization, SSR/SSG support, excellent TypeScript integration |
| UI Component Library | React | 18.x | UI component framework | Industry standard, extensive ecosystem, React Server Components support |
| Styling Framework | Tailwind CSS | 3.x | Utility-first CSS framework | Rapid UI development, mobile-first design, consistent design system |
| State Management | React Query | 5.x | Server state management | Automatic caching, background refetching, optimistic updates, eliminates manual state management |
| Backend Language | Python | 3.11+ | Type-safe backend development | High performance, extensive ecosystem, excellent for data processing and API development |
| Backend Framework | FastAPI | 0.104+ | Modern Python web framework | High performance, automatic API documentation, type safety with Pydantic |
| API Style | REST | - | HTTP-based API design | Simple, familiar, well-supported, easy to debug |
| Database | MySQL | 8.0 | Relational database | ACID compliance, complex relationships, mature ecosystem, reliable for production |
| ORM | SQLAlchemy | 2.0+ | Type-safe database client | Mature ORM, excellent Python integration, flexible query building |
| Cache | React Query | 5.x (built-in) | Frontend caching | Automatic request caching, duplicate request deduplication |
| File Storage | Local/S3/MinIO | - | File attachments storage | Local for dev, S3/MinIO for production, supports images and documents |
| Authentication | FastAPI Security | 0.104+ | Authentication middleware | JWT/credentials, role-based access, OAuth2 support |
| E2E Testing | Playwright | 1.x | End-to-end testing | Multi-browser, reliable, fast execution |
| Bundler | Next.js/Turbopack | 14.x | Module bundling | Built-in bundler, Rust-based, extremely fast |
| IaC Tool | Docker Compose | - | Infrastructure as code | Container definitions, local development environment |
| CI/CD | GitHub Actions | - | Continuous integration | Free for open source, integrates with GitHub, flexible workflows |
| Monitoring | Prometheus + Grafana | - | Metrics and visualization | Open source, powerful querying, rich dashboards |
| Logging | Python Logging | 3.11+ | Structured logging | Built-in Python logging with structured output, minimal overhead |
| Mobile QR Scanner | HTML5 Camera API | - | Mobile camera access | No app installation, works in browser, cross-platform |

### Additional Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Zod | 3.x | Runtime schema validation (Frontend) |
| date-fns | 3.x | Date manipulation and formatting (Frontend) |
| react-hook-form | 7.x | Form state management (Frontend) |
| @tanstack/react-table | 8.x | Data table component (Frontend) |
| recharts | 2.x | Chart visualization (Frontend) |
| axios | 1.x | HTTP client for API calls (Frontend) |
| Pydantic | 2.x | Data validation and serialization (Backend) |
| Alembic | 1.x | Database migration tool (Backend) |
| python-multipart | 0.0.6 | File upload support (Backend) |
| python-jose | 3.x | JWT token handling (Backend) |
| passlib | 1.x | Password hashing (Backend) |

### Rationale Summary

**Python + FastAPI Backend:** High-performance Python backend with automatic API documentation and type safety through Pydantic models.

**Next.js 14 Frontend:** Modern App Router provides excellent DX, built-in optimizations, and seamless server/client component integration.

**SQLAlchemy ORM:** Mature Python ORM with excellent database integration and flexible query building capabilities.

**React Query:** Eliminates 90% of manual state management code with intelligent caching and automatic refetching.

**MySQL:** Relational database with ACID guarantees, perfect for maintenance management with complex relationships.

**Playwright:** Reliable E2E testing with multi-browser support and excellent debugging tools.

**Tailwind CSS:** Rapid UI development with consistent design system, eliminates CSS maintenance burden.

---

## Data Models

This section defines the core data models/entities shared between frontend and backend. These TypeScript interfaces serve as the single source of truth for data structures.

### User Model

**Purpose:** Represents system users with roles and authentication information.

**Key Attributes:**
- `id`: number - Unique user identifier
- `username`: string - User username (unique)
- `fullName`: string - User full name
- `role`: UserRole - User role for authorization
- `createdAt`: Date - Account creation timestamp
- `updatedAt`: Date - Last update timestamp

**TypeScript Interface:**
```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  MAINTENANCE_TECH = 'MAINTENANCE_TECH',
  MAINTENANCE_MANAGER = 'MAINTENANCE_MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER'
}

interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**
- Has many MaintenanceRequests (as reporter)
- Has many MaintenanceWork records (as technician)
- Has many ActivityLogs (as actor)

---

### Machine Model

**Purpose:** Represents factory machines with QR codes for mobile scanning.

**Key Attributes:**
- `id`: number - Unique machine identifier
- `qrCode`: string - Unique QR code identifier
- `name`: string - Machine name
- `model`: string | null - Machine model
- `serialNumber`: string | null - Serial number
- `departmentId`: number - Department assignment
- `location`: string | null - Physical location
- `installationDate`: Date | null - Installation date
- `status`: MachineStatus - Current machine status

**TypeScript Interface:**
```typescript
enum MachineStatus {
  OPERATIONAL = 'OPERATIONAL',
  DOWN = 'DOWN',
  MAINTENANCE = 'MAINTENANCE',
  DECOMMISSIONED = 'DECOMMISSIONED'
}

interface Machine {
  id: number;
  qrCode: string;
  name: string;
  model: string | null;
  serialNumber: string | null;
  departmentId: number;
  location: string | null;
  installationDate: Date | null;
  status: MachineStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  department: Department;
  spareParts: MachineSparePart[];
  maintenanceRequests: MaintenanceRequest[];
}
```

**Relationships:**
- Belongs to Department (many-to-one)
- Has many MaintenanceRequests (one-to-many)
- Has many MachineSpareParts (many-to-many via junction table)

---

### Maintenance Request Model

**Purpose:** Represents maintenance requests created by supervisors, tracked through completion.

**Key Attributes:**
- `id`: number - Unique request identifier
- `machineId`: number - Associated machine
- `reporterId`: number - User who created the request
- `status`: RequestStatus - Current request status
- `priority`: Priority - Request priority level
- `reportedAt`: Date - When request was created
- `problemDescription`: string - Detailed problem description
- `failureCodeId`: number | null - Associated failure code
- `maintenanceTypeId`: number | null - Type of maintenance

**TypeScript Interface:**
```typescript
enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

interface MaintenanceRequest {
  id: number;
  machineId: number;
  reporterId: number;
  status: RequestStatus;
  priority: Priority;
  reportedAt: Date;
  problemDescription: string;
  failureCodeId: number | null;
  maintenanceTypeId: number | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  machine: Machine;
  reporter: User;
  maintenanceWork: MaintenanceWork | null;
  attachments: Attachment[];
  failureCode: FailureCode | null;
  maintenanceType: MaintenanceType | null;
}
```

**Relationships:**
- Belongs to Machine (many-to-one)
- Belongs to User as reporter (many-to-one)
- Has one MaintenanceWork record (one-to-one)
- Has many Attachments (one-to-many)
- Belongs to FailureCode (many-to-one, nullable)
- Belongs to MaintenanceType (many-to-one, nullable)

---

### Maintenance Work Model

**Purpose:** Records work performed by technicians on maintenance requests.

**Key Attributes:**
- `id`: number - Unique work identifier
- `requestId`: number - Associated maintenance request
- `technicianId`: number - Technician performing work
- `startedAt`: Date | null - Work start time
- `completedAt`: Date | null - Work completion time
- `workDescription`: string | null - Description of work performed
- `maintenanceSteps`: string | null - JSON array of maintenance steps

**TypeScript Interface:**
```typescript
interface MaintenanceStep {
  step: number;
  description: string;
  completed: boolean;
  completedAt?: Date;
}

interface MaintenanceWork {
  id: number;
  requestId: number;
  technicianId: number;
  startedAt: Date | null;
  completedAt: Date | null;
  workDescription: string | null;
  maintenanceSteps: MaintenanceStep[] | null; // JSON stored, parsed as array
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  request: MaintenanceRequest;
  technician: User;
  sparePartsRequests: SparePartsRequest[];
}
```

**Relationships:**
- Belongs to MaintenanceRequest (one-to-one)
- Belongs to User as technician (many-to-one)
- Has many SparePartsRequests (one-to-many)

---

### Spare Part Model

**Purpose:** Represents spare parts inventory with tracking and pricing information.

**Key Attributes:**
- `id`: number - Unique spare part identifier
- `partNumber`: string - Unique part number
- `partName`: string - Part name
- `description`: string | null - Detailed description
- `groupNumber`: string | null - Part grouping number
- `groupName`: string | null - Part group name
- `quantity`: number - Current stock quantity
- `minQuantity`: number - Minimum required quantity
- `unitPrice`: number | null - Price per unit
- `location`: string | null - Physical storage location

**TypeScript Interface:**
```typescript
interface SparePart {
  id: number;
  partNumber: string;
  partName: string;
  description: string | null;
  groupNumber: string | null;
  groupName: string | null;
  quantity: number;
  minQuantity: number;
  unitPrice: number | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  inventoryTransactions: InventoryTransaction[];
  sparePartsRequests: SparePartsRequest[];
  machines: MachineSparePart[];
  attachments: Attachment[];
}
```

**Relationships:**
- Has many InventoryTransactions (one-to-many)
- Has many SparePartsRequests (one-to-many)
- Has many Machines (many-to-many via MachineSparePart)
- Has many Attachments (one-to-many)

---

### Spare Parts Request Model

**Purpose:** Tracks parts requests with approval workflow through managers.

**Key Attributes:**
- `id`: number - Unique request identifier
- `maintenanceWorkId`: number - Associated work record
- `sparePartId`: number - Requested spare part
- `quantityRequested`: number - Requested quantity
- `status`: RequestStatus - Request status
- `requestedBy`: number - User who requested
- `approvedBy`: number | null - Manager who approved
- `approvedAt`: Date | null - Approval timestamp

**TypeScript Interface:**
```typescript
enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ISSUED = 'ISSUED'
}

interface SparePartsRequest {
  id: number;
  maintenanceWorkId: number;
  sparePartId: number;
  quantityRequested: number;
  status: RequestStatus;
  requestedBy: number;
  approvedBy: number | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  maintenanceWork: MaintenanceWork;
  sparePart: SparePart;
  requester: User;
  approver: User | null;
  usage: SparePartsUsage | null;
}
```

**Relationships:**
- Belongs to MaintenanceWork (many-to-one)
- Belongs to SparePart (many-to-one)
- Belongs to User as requester (many-to-one)
- Belongs to User as approver (many-to-one, nullable)
- Has one SparePartsUsage record (one-to-one, nullable)

---

### Inventory Transaction Model

**Purpose:** Tracks all inventory movements (IN/OUT/ADJUSTMENT/TRANSFER) with complete audit trail.

**Key Attributes:**
- `id`: number - Unique transaction identifier
- `sparePartId`: number - Part involved in transaction
- `transactionType`: TransactionType - Type of transaction
- `quantity`: number - Transaction quantity
- `referenceType`: ReferenceType - What triggered transaction
- `referenceId`: number | null - Reference record ID
- `performedBy`: number - User who performed transaction
- `transactionDate`: Date - Transaction timestamp
- `notes`: string | null - Transaction notes
- `unitCost`: number | null - Cost per unit

**TypeScript Interface:**
```typescript
enum TransactionType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER'
}

enum ReferenceType {
  PURCHASE = 'PURCHASE',
  MAINTENANCE = 'MAINTENANCE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER'
}

interface InventoryTransaction {
  id: number;
  sparePartId: number;
  transactionType: TransactionType;
  quantity: number;
  referenceType: ReferenceType;
  referenceId: number | null;
  performedBy: number;
  transactionDate: Date;
  notes: string | null;
  unitCost: number | null;
  createdAt: Date;
  
  // Relations
  sparePart: SparePart;
  performer: User;
}
```

**Relationships:**
- Belongs to SparePart (many-to-one)
- Belongs to User as performer (many-to-one)

---

### Attachment Model

**Purpose:** Universal file attachment system for all entity types.

**Key Attributes:**
- `id`: number - Unique attachment identifier
- `entityType`: EntityType - Type of parent entity
- `entityId`: number - Parent entity ID
- `fileUrl`: string - File storage URL/path
- `fileType`: FileType - File type classification
- `uploadedBy`: number - User who uploaded
- `uploadedAt`: Date - Upload timestamp

**TypeScript Interface:**
```typescript
enum EntityType {
  MAINTENANCE_REQUEST = 'MAINTENANCE_REQUEST',
  MACHINE = 'MACHINE',
  SPARE_PART = 'SPARE_PART',
  PREVENTIVE_MAINTENANCE = 'PREVENTIVE_MAINTENANCE',
  INVENTORY_TRANSACTION = 'INVENTORY_TRANSACTION'
}

enum FileType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER'
}

interface Attachment {
  id: number;
  entityType: EntityType;
  entityId: number;
  fileUrl: string;
  fileType: FileType;
  uploadedBy: number;
  uploadedAt: Date;
  
  // Relations
  uploader: User;
}
```

**Relationships:**
- Polymorphic relationship to various entity types
- Belongs to User as uploader (many-to-one)

---

### Department Model

**Purpose:** Represents organizational departments for grouping users and machines.

**Key Attributes:**
- `id`: number - Unique department identifier
- `name`: string - Department name
- `description`: string | null - Department description
- `companyCode`: string | null - Company code identifier
- `companyName`: string | null - Company name

**TypeScript Interface:**
```typescript
interface Department {
  id: number;
  name: string;
  description: string | null;
  companyCode: string | null;
  companyName: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  users: User[];
  machines: Machine[];
}
```

**Relationships:**
- Has many Users (one-to-many)
- Has many Machines (one-to-many)

---

### FailureCode Model

**Purpose:** Standardized failure tracking and categorization for predictive maintenance analysis.

**Key Attributes:**
- `id`: number - Unique failure code identifier
- `code`: string - Unique failure code (e.g., "MECH001", "ELEC002")
- `description`: string - Detailed description of the failure type
- `category`: FailureCategory - Failure category classification

**TypeScript Interface:**
```typescript
enum FailureCategory {
  MECHANICAL = 'MECHANICAL',
  ELECTRICAL = 'ELECTRICAL',
  HYDRAULIC = 'HYDRAULIC',
  PNEUMATIC = 'PNEUMATIC',
  THERMAL = 'THERMAL',
  LUBRICATION = 'LUBRICATION',
  VIBRATION = 'VIBRATION',
  WEAR = 'WEAR'
}

interface FailureCode {
  id: number;
  code: string;
  description: string;
  category: FailureCategory;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  maintenanceRequests: MaintenanceRequest[];
}
```

**Relationships:**
- Has many MaintenanceRequests (one-to-many)

---

### MaintenanceType Model

**Purpose:** Categorize and distinguish between different types of maintenance activities.

**Key Attributes:**
- `id`: number - Unique maintenance type identifier
- `name`: string - Maintenance type name
- `description`: string | null - Detailed description of the maintenance type

**TypeScript Interface:**
```typescript
interface MaintenanceType {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  maintenanceRequests: MaintenanceRequest[];
}
```

**Relationships:**
- Has many MaintenanceRequests (one-to-many)

---

### MachineSparePart Model

**Purpose:** Junction table defining machine-specific spare parts requirements with min/max quantities.

**Key Attributes:**
- `id`: number - Unique relationship identifier
- `machineId`: number - Associated machine
- `sparePartId`: number - Associated spare part
- `minQty`: number - Minimum quantity required for this machine
- `maxQty`: number | null - Maximum quantity recommended for this machine
- `createdAt`: Date - Relationship creation timestamp

**TypeScript Interface:**
```typescript
interface MachineSparePart {
  id: number;
  machineId: number;
  sparePartId: number;
  minQty: number;
  maxQty: number | null;
  createdAt: Date;
  
  // Relations
  machine: Machine;
  sparePart: SparePart;
}
```

**Relationships:**
- Belongs to Machine (many-to-one)
- Belongs to SparePart (many-to-one)
- Unique constraint on (machineId, sparePartId)

---

### SparePartsUsage Model

**Purpose:** Tracks actual usage of spare parts after they are issued.

**Key Attributes:**
- `id`: number - Unique usage identifier
- `sparePartsRequestId`: number - Associated spare parts request
- `quantityUsed`: number - Actual quantity used
- `usedAt`: Date - Usage timestamp

**TypeScript Interface:**
```typescript
interface SparePartsUsage {
  id: number;
  sparePartsRequestId: number;
  quantityUsed: number;
  usedAt: Date;
  createdAt: Date;
  
  // Relations
  sparePartsRequest: SparePartsRequest;
}
```

**Relationships:**
- Belongs to SparePartsRequest (one-to-one)

---

### MachineDowntime Model

**Purpose:** Tracks machine downtime with automatic calculation capabilities.

**Key Attributes:**
- `id`: number - Unique downtime identifier
- `machineId`: number - Associated machine
- `requestId`: number | null - Associated maintenance request
- `startTime`: Date - Downtime start timestamp
- `endTime`: Date | null - Downtime end timestamp
- `durationMinutes`: number | null - Calculated duration in minutes
- `downtimeType`: DowntimeType - Type of downtime
- `autoCalculated`: boolean - Whether downtime was automatically calculated

**TypeScript Interface:**
```typescript
enum DowntimeType {
  MAINTENANCE = 'MAINTENANCE',
  BREAKDOWN = 'BREAKDOWN',
  WAITING_PARTS = 'WAITING_PARTS',
  SCHEDULED = 'SCHEDULED',
  OTHER = 'OTHER'
}

interface MachineDowntime {
  id: number;
  machineId: number;
  requestId: number | null;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  downtimeType: DowntimeType;
  autoCalculated: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  machine: Machine;
  request: MaintenanceRequest | null;
}
```

**Relationships:**
- Belongs to Machine (many-to-one)
- Belongs to MaintenanceRequest (many-to-one, nullable)

---

### ActivityLog Model

**Purpose:** Comprehensive audit trail for all critical user actions and system changes.

**Key Attributes:**
- `id`: number - Unique log identifier
- `userId`: number - User who performed the action
- `action`: LogAction - Type of action performed
- `entityType`: string - Type of entity affected
- `entityId`: number | null - ID of affected entity
- `description`: string - Human-readable description
- `changes`: object | null - JSON object with before/after values
- `ipAddress`: string | null - User's IP address
- `userAgent`: string | null - User's browser/client information
- `createdAt`: Date - Log timestamp

**TypeScript Interface:**
```typescript
enum LogAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ISSUE = 'ISSUE',
  COMPLETE = 'COMPLETE',
  CANCEL = 'CANCEL'
}

interface ActivityLog {
  id: number;
  userId: number;
  action: LogAction;
  entityType: string;
  entityId: number | null;
  description: string;
  changes: object | null; // JSON object
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  
  // Relations
  user: User;
}
```

**Relationships:**
- Belongs to User (many-to-one)

---

### PreventiveMaintenanceTask Model

**Purpose:** Defines recurring maintenance tasks scheduled for machines.

**Key Attributes:**
- `id`: number - Unique task identifier
- `machineId`: number - Associated machine
- `taskName`: string - Task name
- `description`: string | null - Task description
- `frequencyType`: FrequencyType - Frequency type
- `frequencyValue`: number - Frequency value (e.g., every 7 days)
- `nextDueDate`: Date | null - Next scheduled due date
- `lastCompletedAt`: Date | null - Last completion timestamp
- `assignedTo`: number | null - Assigned technician
- `status`: TaskStatus - Task status
- `instructions`: string | null - Task instructions

**TypeScript Interface:**
```typescript
enum FrequencyType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

enum TaskStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

interface PreventiveMaintenanceTask {
  id: number;
  machineId: number;
  taskName: string;
  description: string | null;
  frequencyType: FrequencyType;
  frequencyValue: number;
  nextDueDate: Date | null;
  lastCompletedAt: Date | null;
  assignedTo: number | null;
  status: TaskStatus;
  instructions: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  machine: Machine;
  assignedTechnician: User | null;
  logs: PreventiveMaintenanceLog[];
}
```

**Relationships:**
- Belongs to Machine (many-to-one)
- Belongs to User as assigned technician (many-to-one, nullable)
- Has many PreventiveMaintenanceLogs (one-to-many)

---

### PreventiveMaintenanceLog Model

**Purpose:** Records completion of preventive maintenance tasks.

**Key Attributes:**
- `id`: number - Unique log identifier
- `taskId`: number - Associated preventive maintenance task
- `machineId`: number - Associated machine
- `completedBy`: number - Technician who completed the task
- `completedAt`: Date - Completion timestamp
- `notes`: string | null - Completion notes
- `status`: CompletionStatus - Completion status
- `createdAt`: Date - Log creation timestamp

**TypeScript Interface:**
```typescript
enum CompletionStatus {
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  SKIPPED = 'SKIPPED',
  ISSUES_FOUND = 'ISSUES_FOUND'
}

interface PreventiveMaintenanceLog {
  id: number;
  taskId: number;
  machineId: number;
  completedBy: number;
  completedAt: Date;
  notes: string | null;
  status: CompletionStatus;
  createdAt: Date;
  
  // Relations
  task: PreventiveMaintenanceTask;
  machine: Machine;
  technician: User;
}
```

**Relationships:**
- Belongs to PreventiveMaintenanceTask (many-to-one)
- Belongs to Machine (many-to-one)
- Belongs to User as technician (many-to-one)

---

### Model Design Decisions

**Rationale:**
- **Separate Request and Work Models:** Maintenance requests and work performed are distinct concepts with different lifecycles
- **Polymorphic Attachments:** Universal attachment model eliminates schema changes for new entity types
- **Transaction-Based Inventory:** Complete audit trail of all stock movements for compliance and reporting
- **Status Enums:** Type-safe status tracking across all workflow models
- **Nullable Foreign Keys:** Allow optional relationships (e.g., requests without failure codes)
- **JSON Fields:** Flexible storage for arrays/objects (maintenance steps, maintenanceSteps)
- **Automatic Timestamps:** createdAt/updatedAt on all models for auditing

---

## Unified Project Structure

This project structure accommodates both frontend (Next.js) and backend (FastAPI) applications with clear separation.

```
maintaince_management/
├── .github/
│   └── workflows/
│       ├── ci.yaml              # CI pipeline
│       └── deploy.yaml          # Deployment workflow
├── frontend/                    # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── (auth)/          # Public auth pages
│   │   │   │   ├── login/
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/     # Authenticated pages
│   │   │   │   ├── dashboard/
│   │   │   │   ├── machines/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── inventory/
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── shared/          # Shared React components
│   │   │   │   ├── components/  # Reusable components
│   │   │   │   ├── hooks/       # Shared React hooks
│   │   │   │   └── utils/       # Frontend utilities
│   │   │   ├── forms/           # Form components
│   │   │   ├── tables/          # Data tables
│   │   │   ├── charts/          # Chart components
│   │   │   ├── qr-scanner/      # QR scanner components
│   │   │   │   ├── QRScanner.tsx
│   │   │   │   └── QRScannerTechnician.tsx
│   │   │   ├── layouts/         # Layout components
│   │   │   ├── audit-log-viewer/  # Activity logs viewer
│   │   │   ├── preventive-maintenance-calendar/  # Preventive maintenance calendar
│   │   │   ├── inventory-management/  # Inventory management components
│   │   │   ├── inventory-reports/  # Inventory reporting components
│   │   │   ├── stock-movements/  # Stock movement tracking
│   │   │   ├── file-attachments/  # File attachment components
│   │   │   ├── file-upload/  # File upload components
│   │   │   ├── manual-management/  # Manual management components
│   │   │   ├── documentation-library/  # Documentation library
│   │   │   ├── failure-codes/  # Failure codes management
│   │   │   ├── failure-analysis/  # Failure analysis components
│   │   │   ├── maintenance-types/  # Maintenance types management
│   │   │   ├── maintenance-analysis/  # Maintenance analysis components
│   │   │   ├── machine-spare-parts/  # Machine-spare parts management
│   │   │   └── machine-inventory/  # Machine inventory components
│   │   ├── lib/                 # Utilities
│   │   │   ├── utils.ts         # Helper functions
│   │   │   ├── auth.ts          # Auth utilities
│   │   │   ├── audit.ts         # Activity logging helper
│   │   │   ├── downtime.ts      # Automatic downtime calculation
│   │   │   ├── inventory.ts     # Inventory management helper functions
│   │   │   ├── preventive.ts    # Preventive maintenance helper functions
│   │   │   ├── failure-analysis.ts # Failure analysis helper functions
│   │   │   ├── maintenance-analysis.ts # Maintenance analysis helper functions
│   │   │   └── api-client.ts    # API client setup
│   │   └── types/               # TypeScript types
│   │       ├── index.ts
│   │       └── api.ts
│   ├── public/                  # Static assets
│   │   └── uploads/             # User-uploaded files
│   ├── .env.example
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .eslintrc.js
├── backend/                     # FastAPI backend application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI application entry point
│   │   ├── core/                 # Core configuration
│   │   │   ├── __init__.py
│   │   │   ├── config.py        # Settings and configuration
│   │   │   ├── security.py      # Authentication and security
│   │   │   └── database.py      # Database connection
│   │   ├── api/                 # API routes
│   │   │   ├── __init__.py
│   │   │   ├── deps.py          # Dependencies
│   │   │   └── v1/              # API version 1
│   │   │       ├── __init__.py
│   │   │       ├── auth.py
│   │   │       ├── machines.py
│   │   │       ├── maintenance_requests.py
│   │   │       ├── spare_parts.py
│   │   │       ├── inventory_transactions.py
│   │   │       ├── inventory_reports.py
│   │   │       ├── attachments.py
│   │   │       ├── failure_codes.py
│   │   │       ├── maintenance_types.py
│   │   │       ├── machine_spare_parts.py
│   │   │       ├── reports.py
│   │   │       ├── activity_logs.py
│   │   │       ├── preventive_maintenance.py
│   │   │       ├── downtime.py
│   │   │       └── qr_machines.py
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── machine.py
│   │   │   ├── maintenance_request.py
│   │   │   ├── maintenance_work.py
│   │   │   ├── spare_part.py
│   │   │   ├── inventory_transaction.py
│   │   │   ├── attachment.py
│   │   │   ├── department.py
│   │   │   ├── failure_code.py
│   │   │   ├── maintenance_type.py
│   │   │   ├── machine_spare_part.py
│   │   │   ├── preventive_maintenance.py
│   │   │   ├── downtime.py
│   │   │   └── activity_log.py
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── machine.py
│   │   │   ├── maintenance_request.py
│   │   │   ├── maintenance_work.py
│   │   │   ├── spare_part.py
│   │   │   ├── inventory_transaction.py
│   │   │   ├── attachment.py
│   │   │   ├── department.py
│   │   │   ├── failure_code.py
│   │   │   ├── maintenance_type.py
│   │   │   ├── machine_spare_part.py
│   │   │   ├── preventive_maintenance.py
│   │   │   ├── downtime.py
│   │   │   └── activity_log.py
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── machine_service.py
│   │   │   ├── maintenance_service.py
│   │   │   ├── inventory_service.py
│   │   │   ├── attachment_service.py
│   │   │   ├── audit_service.py
│   │   │   ├── downtime_service.py
│   │   │   ├── preventive_service.py
│   │   │   └── failure_analysis_service.py
│   │   └── utils/                # Utility functions
│   │       ├── __init__.py
│   │       ├── auth.py
│   │       ├── audit.py
│   │       ├── downtime.py
│   │       ├── inventory.py
│   │       ├── preventive.py
│   │       └── failure_analysis.py
│   ├── alembic/                 # Database migrations
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile
│   └── .env.example
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web       # Frontend Dockerfile
│   │   ├── Dockerfile.api       # Backend Dockerfile
│   │   └── docker-compose.yml
│   └── kubernetes/              # K8s manifests (optional)
├── scripts/                     # Build/deploy scripts
├── docs/                        # Documentation
│   ├── architecture.md          # This file
│   ├── prd.md                   # Product Requirements
│   └── api.md                   # API documentation
├── .env.example                 # Environment template
├── .gitignore
└── README.md
```

---

## Implementation Details

This section provides detailed implementation guidance for key system components.

### Inventory Management Implementation

**Automatic Quantity Update System:**

The inventory system uses a transaction-based approach to maintain accurate stock levels with complete audit trails.

```typescript
// /lib/inventory.ts
export class InventoryService {
  async createTransaction(params: {
    sparePartId: number;
    transactionType: TransactionType;
    quantity: number;
    referenceType: ReferenceType;
    referenceId?: number;
    performedBy: number;
    notes?: string;
    unitCost?: number;
  }): Promise<InventoryTransaction> {
    const transaction = await prisma.inventoryTransaction.create({
      data: params
    });

    // Automatically update spare part quantity
    await this.updateSparePartQuantity(
      params.sparePartId, 
      params.transactionType, 
      params.quantity
    );

    // Log activity
    await logActivity({
      userId: params.performedBy,
      action: 'CREATE',
      entityType: 'INVENTORY_TRANSACTION',
      entityId: transaction.id,
      description: `Created ${params.transactionType} transaction for ${params.quantity} units`
    });

    return transaction;
  }

  private async updateSparePartQuantity(
    sparePartId: number, 
    transactionType: TransactionType, 
    quantity: number
  ): Promise<void> {
    const sparePart = await prisma.sparePart.findUnique({
      where: { id: sparePartId }
    });

    if (!sparePart) throw new Error('Spare part not found');

    let newQuantity: number;
    switch (transactionType) {
      case 'IN':
        newQuantity = sparePart.quantity + quantity;
        break;
      case 'OUT':
        if (sparePart.quantity < quantity) {
          throw new Error('Insufficient stock');
        }
        newQuantity = sparePart.quantity - quantity;
        break;
      case 'ADJUSTMENT':
        newQuantity = quantity;
        break;
      case 'TRANSFER':
        newQuantity = sparePart.quantity - quantity;
        break;
    }

    await prisma.sparePart.update({
      where: { id: sparePartId },
      data: { quantity: newQuantity }
    });
  }

  async generateLowStockAlerts(): Promise<SparePart[]> {
    return await prisma.sparePart.findMany({
      where: {
        quantity: {
          lt: prisma.sparePart.fields.minQuantity
        }
      },
      include: {
        machines: {
          include: {
            machine: true
          }
        }
      }
    });
  }

  async getConsumptionReport(dateRange: { start: Date; end: Date }): Promise<ConsumptionReport> {
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        transactionType: 'OUT',
        transactionDate: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      include: {
        sparePart: true
      }
    });

    // Group by spare part and calculate consumption
    const consumption = transactions.reduce((acc, transaction) => {
      const partId = transaction.sparePartId;
      if (!acc[partId]) {
        acc[partId] = {
          sparePart: transaction.sparePart,
          totalConsumed: 0,
          transactions: []
        };
      }
      acc[partId].totalConsumed += transaction.quantity;
      acc[partId].transactions.push(transaction);
      return acc;
    }, {} as Record<number, ConsumptionData>);

    return {
      dateRange,
      consumption: Object.values(consumption),
      totalTransactions: transactions.length
    };
  }
}
```

**Low Stock Alert System:**

```typescript
// /lib/alerts.ts
export class AlertService {
  async checkLowStockAlerts(): Promise<void> {
    const lowStockParts = await inventoryService.generateLowStockAlerts();
    
    for (const part of lowStockParts) {
      // Send notification to inventory managers
      await this.sendLowStockNotification(part);
      
      // Create activity log
      await logActivity({
        userId: 0, // System user
        action: 'CREATE',
        entityType: 'ALERT',
        entityId: part.id,
        description: `Low stock alert: ${part.partName} (${part.quantity}/${part.minQuantity})`
      });
    }
  }

  private async sendLowStockNotification(part: SparePart): Promise<void> {
    const inventoryManagers = await prisma.user.findMany({
      where: { role: 'INVENTORY_MANAGER' }
    });

    // Implementation depends on notification system (email, SMS, etc.)
    for (const manager of inventoryManagers) {
      await this.sendNotification(manager, {
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${part.partName} is below minimum quantity (${part.quantity}/${part.minQuantity})`,
        data: { sparePartId: part.id }
      });
    }
  }
}
```

### Failure Codes & Analysis Implementation

**Failure Code Management:**

```typescript
// /lib/failure-analysis.ts
export class FailureAnalysisService {
  async getFailurePatterns(machineId?: number): Promise<FailurePattern[]> {
    const whereClause = machineId ? { machineId } : {};
    
    const failures = await prisma.maintenanceRequest.findMany({
      where: {
        ...whereClause,
        failureCodeId: { not: null }
      },
      include: {
        failureCode: true,
        machine: true
      }
    });

    // Group by failure code and analyze patterns
    const patterns = failures.reduce((acc, request) => {
      const code = request.failureCode!.code;
      if (!acc[code]) {
        acc[code] = {
          failureCode: request.failureCode!,
          count: 0,
          machines: new Set(),
          avgResolutionTime: 0,
          totalResolutionTime: 0
        };
      }
      
      acc[code].count++;
      acc[code].machines.add(request.machineId);
      
      // Calculate resolution time if completed
      if (request.status === 'COMPLETED' && request.maintenanceWork?.completedAt) {
        const resolutionTime = request.maintenanceWork.completedAt.getTime() - request.reportedAt.getTime();
        acc[code].totalResolutionTime += resolutionTime;
        acc[code].avgResolutionTime = acc[code].totalResolutionTime / acc[code].count;
      }
      
      return acc;
    }, {} as Record<string, FailurePattern>);

    return Object.values(patterns).map(pattern => ({
      ...pattern,
      machines: Array.from(pattern.machines),
      frequency: pattern.count,
      avgResolutionTimeMinutes: Math.round(pattern.avgResolutionTime / (1000 * 60))
    }));
  }

  async getMTBFAnalysis(machineId: number): Promise<MTBFAnalysis> {
    const requests = await prisma.maintenanceRequest.findMany({
      where: {
        machineId,
        status: 'COMPLETED',
        failureCodeId: { not: null }
      },
      include: {
        failureCode: true,
        maintenanceWork: true
      },
      orderBy: { reportedAt: 'asc' }
    });

    if (requests.length < 2) {
      return { machineId, mtbf: 0, totalFailures: requests.length };
    }

    let totalTimeBetweenFailures = 0;
    for (let i = 1; i < requests.length; i++) {
      const timeBetween = requests[i].reportedAt.getTime() - requests[i-1].reportedAt.getTime();
      totalTimeBetweenFailures += timeBetween;
    }

    const mtbf = totalTimeBetweenFailures / (requests.length - 1);
    
    return {
      machineId,
      mtbf: Math.round(mtbf / (1000 * 60 * 60 * 24)), // Convert to days
      totalFailures: requests.length,
      avgResolutionTime: this.calculateAvgResolutionTime(requests)
    };
  }

  private calculateAvgResolutionTime(requests: any[]): number {
    const completedRequests = requests.filter(r => r.maintenanceWork?.completedAt);
    if (completedRequests.length === 0) return 0;

    const totalTime = completedRequests.reduce((sum, request) => {
      const resolutionTime = request.maintenanceWork.completedAt.getTime() - request.reportedAt.getTime();
      return sum + resolutionTime;
    }, 0);

    return Math.round(totalTime / completedRequests.length / (1000 * 60)); // Convert to minutes
  }
}
```

### Machine-Specific Spare Parts Implementation

**Machine-Spare Parts Management:**

```typescript
// /lib/machine-spare-parts.ts
export class MachineSparePartsService {
  async createMachineSparePartRelationship(params: {
    machineId: number;
    sparePartId: number;
    minQty: number;
    maxQty?: number;
  }): Promise<MachineSparePart> {
    // Check if relationship already exists
    const existing = await prisma.machineSparePart.findUnique({
      where: {
        machineId_sparePartId: {
          machineId: params.machineId,
          sparePartId: params.sparePartId
        }
      }
    });

    if (existing) {
      throw new Error('Machine-spare part relationship already exists');
    }

    const relationship = await prisma.machineSparePart.create({
      data: params,
      include: {
        machine: true,
        sparePart: true
      }
    });

    await logActivity({
      userId: 0, // Will be replaced with actual user ID in implementation
      action: 'CREATE',
      entityType: 'MACHINE_SPARE_PART',
      entityId: relationship.id,
      description: `Created relationship between ${relationship.machine.name} and ${relationship.sparePart.partName}`
    });

    return relationship;
  }

  async getMachineSparePartsAvailability(machineId: number): Promise<MachineSparePartAvailability[]> {
    const relationships = await prisma.machineSparePart.findMany({
      where: { machineId },
      include: {
        sparePart: true,
        machine: true
      }
    });

    return relationships.map(rel => ({
      ...rel,
      currentQuantity: rel.sparePart.quantity,
      isLowStock: rel.sparePart.quantity < rel.minQty,
      stockStatus: this.getStockStatus(rel.sparePart.quantity, rel.minQty, rel.maxQty),
      lastUsed: this.getLastUsedDate(rel.sparePartId)
    }));
  }

  async getCrossMachineAnalysis(sparePartId: number): Promise<CrossMachineAnalysis> {
    const relationships = await prisma.machineSparePart.findMany({
      where: { sparePartId },
      include: {
        machine: true,
        sparePart: true
      }
    });

    const totalRequired = relationships.reduce((sum, rel) => sum + rel.minQty, 0);
    const currentStock = relationships[0]?.sparePart.quantity || 0;
    const stockCoverage = currentStock / totalRequired;

    return {
      sparePart: relationships[0]?.sparePart,
      machines: relationships.map(rel => ({
        machine: rel.machine,
        minQty: rel.minQty,
        maxQty: rel.maxQty,
        isLowStock: currentStock < rel.minQty
      })),
      totalRequired,
      currentStock,
      stockCoverage: Math.round(stockCoverage * 100),
      recommendation: this.getStockRecommendation(stockCoverage)
    };
  }

  private getStockStatus(current: number, min: number, max?: number): 'CRITICAL' | 'LOW' | 'ADEQUATE' | 'EXCESS' {
    if (current < min) return 'CRITICAL';
    if (current < min * 1.5) return 'LOW';
    if (max && current > max) return 'EXCESS';
    return 'ADEQUATE';
  }

  private getStockRecommendation(coverage: number): string {
    if (coverage < 50) return 'URGENT: Reorder immediately';
    if (coverage < 80) return 'LOW: Consider reordering soon';
    if (coverage > 150) return 'EXCESS: Reduce stock levels';
    return 'ADEQUATE: Stock levels are appropriate';
  }

  private async getLastUsedDate(sparePartId: number): Promise<Date | null> {
    const lastUsage = await prisma.sparePartsUsage.findFirst({
      where: {
        sparePartsRequest: {
          sparePartId
        }
      },
      orderBy: { usedAt: 'desc' }
    });

    return lastUsage?.usedAt || null;
  }
}
```

### Preventive Maintenance Implementation

**Preventive Maintenance Service:**

```typescript
// /lib/preventive.ts
export class PreventiveMaintenanceService {
  async createTask(params: {
    machineId: number;
    taskName: string;
    description?: string;
    frequencyType: FrequencyType;
    frequencyValue: number;
    assignedTo?: number;
    instructions?: string;
  }): Promise<PreventiveMaintenanceTask> {
    const nextDueDate = this.calculateNextDueDate(
      params.frequencyType, 
      params.frequencyValue
    );

    const task = await prisma.preventiveMaintenanceTask.create({
      data: {
        ...params,
        nextDueDate,
        status: 'ACTIVE'
      },
      include: {
        machine: true,
        assignedTechnician: true
      }
    });

    await logActivity({
      userId: 0, // Will be replaced with actual user ID
      action: 'CREATE',
      entityType: 'PREVENTIVE_MAINTENANCE_TASK',
      entityId: task.id,
      description: `Created preventive task: ${task.taskName} for ${task.machine.name}`
    });

    return task;
  }

  async getUpcomingTasks(userId?: number): Promise<PreventiveMaintenanceTask[]> {
    const whereClause: any = {
      status: 'ACTIVE',
      nextDueDate: {
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    };

    if (userId) {
      whereClause.assignedTo = userId;
    }

    return await prisma.preventiveMaintenanceTask.findMany({
      where: whereClause,
      include: {
        machine: true,
        assignedTechnician: true
      },
      orderBy: { nextDueDate: 'asc' }
    });
  }

  async completeTask(taskId: number, completion: {
    completedBy: number;
    notes?: string;
    status: CompletionStatus;
    issuesFound?: boolean;
  }): Promise<void> {
    const task = await prisma.preventiveMaintenanceTask.findUnique({
      where: { id: taskId }
    });

    if (!task) throw new Error('Task not found');

    // Create completion log
    await prisma.preventiveMaintenanceLog.create({
      data: {
        taskId,
        machineId: task.machineId,
        completedBy: completion.completedBy,
        completedAt: new Date(),
        notes: completion.notes,
        status: completion.status
      }
    });

    // Update task
    const nextDueDate = this.calculateNextDueDate(
      task.frequencyType,
      task.frequencyValue,
      new Date()
    );

    await prisma.preventiveMaintenanceTask.update({
      where: { id: taskId },
      data: {
        lastCompletedAt: new Date(),
        nextDueDate,
        status: completion.issuesFound ? 'PAUSED' : 'ACTIVE'
      }
    });

    // If issues found, create maintenance request
    if (completion.issuesFound) {
      await this.createMaintenanceRequestFromTask(task, completion.completedBy);
    }

    await logActivity({
      userId: completion.completedBy,
      action: 'COMPLETE',
      entityType: 'PREVENTIVE_MAINTENANCE_TASK',
      entityId: taskId,
      description: `Completed preventive task: ${task.taskName}`
    });
  }

  private calculateNextDueDate(
    frequencyType: FrequencyType, 
    frequencyValue: number, 
    fromDate: Date = new Date()
  ): Date {
    const nextDate = new Date(fromDate);
    
    switch (frequencyType) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + frequencyValue);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + (frequencyValue * 7));
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + frequencyValue);
        break;
      case 'QUARTERLY':
        nextDate.setMonth(nextDate.getMonth() + (frequencyValue * 3));
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + frequencyValue);
        break;
    }
    
    return nextDate;
  }

  private async createMaintenanceRequestFromTask(
    task: PreventiveMaintenanceTask, 
    completedBy: number
  ): Promise<void> {
    await prisma.maintenanceRequest.create({
      data: {
        machineId: task.machineId,
        reporterId: completedBy,
        status: 'PENDING',
        priority: 'HIGH',
        reportedAt: new Date(),
        problemDescription: `Issues found during preventive maintenance: ${task.taskName}`,
        maintenanceTypeId: await this.getPreventiveMaintenanceTypeId()
      }
    });
  }

  private async getPreventiveMaintenanceTypeId(): Promise<number> {
    const maintenanceType = await prisma.maintenanceType.findFirst({
      where: { name: 'PREVENTIVE' }
    });
    return maintenanceType?.id || 0;
  }
}
```

---

## Development Workflow

### Local Development Setup

**Prerequisites:**
```bash
Node.js 18+ (recommended: Node.js 20 LTS)
npm 9+ or pnpm 8+ (pnpm recommended)
Docker Desktop (for MySQL)
Git
```

**Initial Setup:**
```bash
# Clone repository
git clone <repository-url>
cd maintaince_management

# Install frontend dependencies
cd frontend
npm install  # or pnpm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Copy environment files
cp .env.example .env
cd ../frontend
cp .env.example .env.local

# Start Docker containers (MySQL)
cd ..
docker-compose up -d

# Run database migrations
cd backend
alembic upgrade head

# Start development servers
# Terminal 1 - Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd ../frontend
npm run dev
```

**Development Commands:**
```bash
# Frontend Development
cd frontend
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run test         # Run frontend tests

# Backend Development
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # Start FastAPI server
alembic upgrade head  # Run database migrations
alembic revision --autogenerate -m "description"  # Create new migration
pytest              # Run backend tests
black .             # Format Python code
flake8 .            # Lint Python code

# Database Management
docker-compose up -d  # Start MySQL container
docker-compose down   # Stop containers
```

---

## Environment Configuration

**Required Environment Variables:**

**.env.local (frontend):**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME="Maintenance Management"
```

**.env (backend/FastAPI):**
```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/maintenance_db"

# Authentication
SECRET_KEY="your-secret-key-here"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Storage (development)
UPLOAD_DIR="./uploads"

# Optional: Email configuration
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

---

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel (recommended) or self-hosted with Nginx
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Environment Variables:** All `NEXT_PUBLIC_*` variables required

**Backend Deployment:**
- **Platform:** Docker container or cloud platform (AWS, DigitalOcean, Railway)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Environment Variables:** Database URL, secret keys, and API configuration

**Database Deployment:**
- **Platform:** Docker container or managed MySQL (AWS RDS, DigitalOcean)
- **Backup Strategy:** Daily automated backups
- **Connection:** SSL-enabled connection strings

### CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
# .github/workflows/ci.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | localhost:3001 | localhost:8001 | Local development |
| Staging | staging.yourapp.com | api-staging.yourapp.com | Pre-production testing |
| Production | app.yourapp.com | api.yourapp.com | Live production |

---

## Key Architectural Decisions Summary

1. **Next.js 14 App Router:** Modern routing and server components for optimal performance
2. **FastAPI Backend:** High-performance Python API with automatic documentation and type safety
3. **SQLAlchemy ORM:** Mature Python ORM with excellent database integration
4. **React Query:** Server state management with intelligent caching
5. **Simple Project Structure:** Clear separation between frontend and backend applications
6. **TypeScript Frontend:** Type safety across frontend with Python backend
7. **REST API:** Simple, predictable HTTP-based API design
8. **MySQL Database:** Reliable relational data with ACID guarantees
9. **Docker Deployment:** Consistent environments across development and production
10. **Role-Based Access Control:** Secure multi-user workflow system
11. **Transaction-Based Inventory:** Complete audit trail for compliance

---

**End of Architecture Document**
