export enum UserRole {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  MAINTENANCE_TECH = 'MAINTENANCE_TECH',
  MAINTENANCE_MANAGER = 'MAINTENANCE_MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// User Management Types
export interface UserCreate {
  username: string;
  fullName: string;
  password: string;
  role: UserRole;
}

export interface UserUpdate {
  username?: string;
  fullName?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Department Types
export interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentCreate {
  name: string;
  description?: string;
}

export interface DepartmentUpdate {
  name?: string;
  description?: string;
}

// Machine Types
export enum MachineStatus {
  OPERATIONAL = 'OPERATIONAL',
  DOWN = 'DOWN',
  MAINTENANCE = 'MAINTENANCE',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export interface Machine {
  id: number;
  qrCode: string;
  name: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  installationDate?: string;
  status: MachineStatus;
  departmentId: number;
  createdAt: string;
  updatedAt: string;
  department: Department;
}

export interface MachineCreate {
  name: string;
  model?: string;
  serialNumber?: string;
  departmentId: number;
  location?: string;
  installationDate?: string;
  status?: MachineStatus;
  qrCode?: string;
}

export interface MachineUpdate {
  name?: string;
  model?: string;
  serialNumber?: string;
  departmentId?: number;
  location?: string;
  installationDate?: string;
  status?: MachineStatus;
}

export interface MachineListResponse {
  machines: Machine[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MachineStatusSummaryResponse {
  counts: Record<MachineStatus, number>;
  total: number;
}

export interface QRCodeResponse {
  qrCode: string;
  qrCodeImage: string;
  machineId: number;
  machineName: string;
}

// Machine Detail Types
export interface DepartmentBasicInfo {
  id: number;
  name: string;
  description?: string;
}

export interface MaintenanceRequestBasicInfo {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  requestedDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  requestedById: number;
}

export interface SparePartBasicInfo {
  id: number;
  partNumber: string;
  name: string;
  currentStock: number;
  minimumStock: number;
  unitPrice?: number;
}

// Spare Parts Types
export type StockStatus = 'CRITICAL' | 'LOW' | 'ADEQUATE' | 'EXCESS';

export interface SparePartCategory {
  id: number;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SparePart {
  id: number;
  partNumber: string;
  partName: string;
  description?: string;
  categoryId?: number;
  category?: SparePartCategory;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unitPrice?: number;
  supplier?: string;
  supplierPartNumber?: string;
  location?: string;
  isActive: boolean;
  transactionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SparePartCreate {
  partNumber: string;
  partName: string;
  description?: string;
  categoryId?: number;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  unitPrice?: number;
  supplier?: string;
  supplierPartNumber?: string;
  location?: string;
}

export interface SparePartUpdate {
  partNumber?: string;
  partName?: string;
  description?: string;
  categoryId?: number;
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  unitPrice?: number;
  supplier?: string;
  supplierPartNumber?: string;
  location?: string;
  isActive?: boolean;
}

export interface SparePartListResponse {
  spareParts: SparePart[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SparePartFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number | number[];
  stockStatus?: StockStatus | StockStatus[];
  isActive?: boolean;
  sortBy?: 'partNumber' | 'partName' | 'currentStock' | 'categoryName';
  sortOrder?: 'asc' | 'desc';
}

export interface MachineSparePartInfo {
  id: number;
  quantityRequired: number;
  notes?: string;
  sparePart: SparePartBasicInfo;
  stockStatus?: string; // 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'
}

export interface AttachmentBasicInfo {
  id: number;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedById: number;
  uploadedAt: string;
}

export interface MachineDetailResponse {
  // Machine information
  id: number;
  qrCode: string;
  name: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  installationDate?: string;
  status: MachineStatus;
  createdAt: string;
  updatedAt: string;
  
  // Department details
  departmentId: number;
  department?: DepartmentBasicInfo;
  
  // Maintenance information
  maintenanceHistory: MaintenanceRequestBasicInfo[];
  activeMaintenance: MaintenanceRequestBasicInfo[];
  totalMaintenanceCount: number;
  
  // Spare parts requirements
  sparePartsRequirements: MachineSparePartInfo[];
  
  // File attachments
  attachments: AttachmentBasicInfo[];
  
  // Pagination info for maintenance history
  maintenanceHistoryPage: number;
  maintenanceHistoryPageSize: number;
  maintenanceHistoryTotalPages: number;
}

// Maintenance Request Types
export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  requestedDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  machineId: number;
  requestedById: number;
  requestedByName?: string;
  failureCodeId?: number;
  maintenanceTypeId?: number;
  createdAt: string;
  updatedAt: string;
  attachments?: AttachmentBasicInfo[];
}

export interface MaintenanceRequestCreate {
  machineId: number;
  title: string;
  description: string;
  priority: RequestPriority;
  failureCodeId?: number;
  maintenanceTypeId?: number;
  expectedCompletionDate?: string;
  machineStatus?: MachineStatus;
}

// Dashboard-specific types
export interface MaintenanceRequestListResponse {
  requests: MaintenanceRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MaintenanceRequestFilters {
  status?: RequestStatus;
  priority?: RequestPriority;
  machineId?: number;
  requestedById?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FailureCode {
  id: number;
  code: string;
  description: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceType {
  id: number;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Inventory Transaction Types
export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
export type ReferenceType = 'PURCHASE' | 'MAINTENANCE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';

export interface InventoryTransaction {
  id: number;
  sparePartId: number;
  sparePartNumber?: string;
  sparePartName?: string;
  transactionType: TransactionType;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  referenceType?: ReferenceType;
  referenceNumber?: string;
  notes?: string;
  transactionDate: string;
  performedById?: number;
  performedByName?: string;
  beforeQuantity?: number;
  afterQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionCreate {
  sparePartId: number;
  transactionType: TransactionType;
  quantity: number;
  unitPrice?: number;
  referenceType?: ReferenceType;
  referenceNumber?: string;
  notes?: string;
  transactionDate?: string;
}

export interface InventoryTransactionUpdate {
  unitPrice?: number;
  notes?: string;
}

export interface InventoryTransactionListResponse {
  transactions: InventoryTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InventoryTransactionFilters {
  page?: number;
  pageSize?: number;
  transactionType?: TransactionType;
  referenceType?: ReferenceType;
  sparePartId?: number;
  dateFrom?: string;
  dateTo?: string;
  performedBy?: number;
  search?: string;
  sortBy?: 'transactionDate' | 'quantity' | 'totalValue';
  sortOrder?: 'asc' | 'desc';
}

// Spare Parts Request Types
export type SparePartsRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';

export interface SparePartsRequest {
  id: number;
  maintenanceWorkId: number;
  sparePartId: number;
  quantityRequested: number;
  status: SparePartsRequestStatus;
  requestedBy: number;
  requestedByName?: string;
  approvedBy?: number;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  approvalNotes?: string;
  isRequestedReturn?: boolean;
  returnDate?: string;
  isReturned?: boolean;
  maintenanceWorkDescription?: string;
  sparePartNumber?: string;
  sparePartName?: string;
  currentStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SparePartsRequestCreate {
  maintenanceWorkId: number;
  sparePartId: number;
  quantityRequested: number;
}

export interface ApproveRequest {
  approvalNotes?: string;
}

export interface RejectRequest {
  rejectionReason: string;
}

export interface SparePartsRequestListResponse {
  requests: SparePartsRequest[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SparePartsRequestFilters {
  page?: number;
  pageSize?: number;
  status?: SparePartsRequestStatus;
  maintenanceWorkId?: number;
  sparePartId?: number;
  requestedBy?: number;
  isRequestedReturn?: boolean;
  isReturned?: boolean;
}

// Maintenance Work Types
export enum WorkStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export interface MaintenanceStep {
  step: number;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface MaintenanceWork {
  id: number;
  requestId: number;
  assignedToId: number;
  machineId: number;
  workDescription: string;
  status: WorkStatus;
  startTime?: string;
  endTime?: string;
  estimatedHours?: number;
  actualHours?: number;
  laborCost?: number;
  materialCost?: number;
  totalCost?: number;
  failureCodeId?: number;
  maintenanceTypeId?: number;
  maintenanceSteps?: MaintenanceStep[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceWorkCreate {
  requestId: number;
  startedAt?: string;
  workDescription?: string;
  maintenanceSteps?: MaintenanceStep[];
}

export interface MaintenanceWorkUpdate {
  startedAt?: string;
  workDescription?: string;
  maintenanceSteps?: MaintenanceStep[];
  completedAt?: string;
  status?: WorkStatus;
}

export interface MaintenanceWorkStart {
  workDescription?: string;
  maintenanceSteps?: MaintenanceStep[];
}

export interface MaintenanceWorkProgressUpdate {
  maintenanceSteps: MaintenanceStep[];
}

export interface MaintenanceWorkComplete {
  workDescription: string;
  maintenanceSteps?: MaintenanceStep[];
}