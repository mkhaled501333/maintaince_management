import { apiClient } from '../api-client';

// Downtime Report Types
export interface MachineDowntimeStats {
  machineId: number;
  machineName: string;
  departmentId: number;
  departmentName?: string;
  totalDowntime: number;
  frequency: number;
  avgDowntime: number;
}

export interface DepartmentDowntimeStats {
  departmentId: number;
  departmentName?: string;
  totalDowntime: number;
  frequency: number;
  avgDowntime: number;
}

export interface DowntimeReportResponse {
  totalDowntimeHours: number;
  totalDowntimeMinutes: number;
  frequency: number;
  avgDowntimeHours: number;
  avgDowntimeMinutes: number;
  byMachine: MachineDowntimeStats[];
  byDepartment: DepartmentDowntimeStats[];
}

export interface DowntimeReportFilters {
  machineId?: number;
  departmentId?: number;
  startDate?: string;
  endDate?: string;
  export?: 'csv' | 'excel';
}

// Maintenance Cost Report Types
export interface MachineCostStats {
  machineId: number;
  machineName: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  maintenanceCount: number;
}

export interface MaintenanceTypeCostStats {
  maintenanceTypeId: number;
  maintenanceTypeName: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  maintenanceCount: number;
}

export interface MaintenanceCostReportResponse {
  totalPartsCost: number;
  totalLaborCost: number;
  totalCost: number;
  byMachine: MachineCostStats[];
  byMaintenanceType: MaintenanceTypeCostStats[];
}

export interface MaintenanceCostReportFilters {
  machineId?: number;
  maintenanceTypeId?: number;
  startDate?: string;
  endDate?: string;
  export?: 'csv' | 'excel';
}

// Failure Analysis Report Types
export interface FailurePattern {
  failureCodeId: number;
  failureCode: string;
  failureDescription: string;
  failureCategory?: string;
  frequency: number;
  affectedMachineCount: number;
  affectedMachines: number[];
  avgResolutionTimeMinutes: number;
  resolutionCount: number;
}

export interface FailureAnalysisReportResponse {
  totalFailures: number;
  uniqueFailureCodes: number;
  failurePatterns: FailurePattern[];
  recurringIssues: FailurePattern[];
}

export interface FailureAnalysisReportFilters {
  machineId?: number;
  departmentId?: number;
  startDate?: string;
  endDate?: string;
  failureCategory?: string;
  export?: 'csv' | 'excel';
}

// Inventory Report Types
export interface StockLevelItem {
  id: number;
  partNumber: string;
  partName: string;
  description?: string;
  categoryNumber?: string;
  categoryName?: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  unitPrice?: number;
  location?: string;
  status: string;
}

export interface StockLevelsReportResponse {
  items: StockLevelItem[];
  totalItems: number;
  criticalCount: number;
  lowStockCount: number;
}

export interface StockLevelsFilters {
  groupNumber?: string;
  groupName?: string;
  location?: string;
  export?: 'csv' | 'excel';
}

export interface ConsumptionItem {
  partId: number;
  partNumber: string;
  partName: string;
  categoryNumber?: string;
  categoryName?: string;
  location?: string;
  quantityConsumed: number;
  totalValue: number;
}

export interface ConsumptionReportResponse {
  totalConsumption: number;
  byPart: ConsumptionItem[];
  transactionCount: number;
}

export interface ConsumptionFilters {
  dateFrom?: string;
  dateTo?: string;
  machineId?: number;
  groupNumber?: string;
  location?: string;
  export?: 'csv' | 'excel';
}

export interface ValuationByGroup {
  groupNumber: string;
  groupName: string;
  totalValuation: number;
  partCount: number;
}

export interface ValuationReportResponse {
  totalValuation: number;
  byGroup: ValuationByGroup[];
}

export interface ValuationFilters {
  groupNumber?: string;
  export?: 'csv' | 'excel';
}

export interface ReorderItem {
  id: number;
  partNumber: string;
  partName: string;
  categoryNumber?: string;
  categoryName?: string;
  location?: string;
  currentQuantity: number;
  minQuantity: number;
  shortfall: number;
  suggestedReorderQty: number;
  unitPrice?: number;
  estimatedCost: number;
}

export interface ReorderReportResponse {
  items: ReorderItem[];
  totalItems: number;
}

export interface ReorderFilters {
  groupNumber?: string;
  location?: string;
  export?: 'csv' | 'excel';
}

// Reports API
export const reportsApi = {
  // Get downtime report
  getDowntimeReport: async (filters: DowntimeReportFilters = {}): Promise<DowntimeReportResponse | Blob> => {
    const params = new URLSearchParams();
    
    if (filters.machineId) params.append('machineId', filters.machineId.toString());
    if (filters.departmentId) params.append('departmentId', filters.departmentId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.export) params.append('export', filters.export);

    const responseType = filters.export ? 'blob' : 'json';
    const response = await apiClient.get(`/reports/downtime?${params.toString()}`, {
      responseType,
    });
    
    return response.data;
  },

  // Get maintenance cost report
  getMaintenanceCostReport: async (filters: MaintenanceCostReportFilters = {}): Promise<MaintenanceCostReportResponse | Blob> => {
    const params = new URLSearchParams();
    
    if (filters.machineId) params.append('machineId', filters.machineId.toString());
    if (filters.maintenanceTypeId) params.append('maintenanceTypeId', filters.maintenanceTypeId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.export) params.append('export', filters.export);

    const responseType = filters.export ? 'blob' : 'json';
    const response = await apiClient.get(`/reports/maintenance-costs?${params.toString()}`, {
      responseType,
    });
    
    return response.data;
  },

  // Get failure analysis report
  getFailureAnalysisReport: async (filters: FailureAnalysisReportFilters = {}): Promise<FailureAnalysisReportResponse | Blob> => {
    const params = new URLSearchParams();
    
    if (filters.machineId) params.append('machineId', filters.machineId.toString());
    if (filters.departmentId) params.append('departmentId', filters.departmentId.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.failureCategory) params.append('failureCategory', filters.failureCategory);
    if (filters.export) params.append('export', filters.export);

    const responseType = filters.export ? 'blob' : 'json';
    const response = await apiClient.get(`/reports/failure-analysis?${params.toString()}`, {
      responseType,
    });
    
    return response.data;
  },

  // Get inventory stock levels report
  getInventoryStockLevels: async (filters: StockLevelsFilters = {}): Promise<StockLevelsReportResponse | Blob> => {
    const params = new URLSearchParams();
    
    if (filters.groupNumber) params.append('groupNumber', filters.groupNumber);
    if (filters.groupName) params.append('groupName', filters.groupName);
    if (filters.location) params.append('location', filters.location);
    if (filters.export) params.append('export', filters.export);

    const responseType = filters.export ? 'blob' : 'json';
    const response = await apiClient.get(`/reports/inventory/stock-levels?${params.toString()}`, {
      responseType,
    });
    
    return response.data;
  },

  // Get inventory consumption report
  getInventoryConsumption: async (filters: ConsumptionFilters = {}): Promise<ConsumptionReportResponse | Blob> => {
    const params = new URLSearchParams();
    
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.machineId) params.append('machineId', filters.machineId.toString());
    if (filters.groupNumber) params.append('groupNumber', filters.groupNumber);
    if (filters.location) params.append('location', filters.location);
    if (filters.export) params.append('export', filters.export);

    const responseType = filters.export ? 'blob' : 'json';
    const response = await apiClient.get(`/reports/inventory/consumption?${params.toString()}`, {
      responseType,
    });
    
    return response.data;
  },

  // Get inventory valuation report
  getInventoryValuation: async (filters: ValuationFilters = {}): Promise<ValuationReportResponse | Blob> => {
    const params = new URLSearchParams();
    
    if (filters.groupNumber) params.append('groupNumber', filters.groupNumber);
    if (filters.export) params.append('export', filters.export);

    const responseType = filters.export ? 'blob' : 'json';
    const response = await apiClient.get(`/reports/inventory/valuation?${params.toString()}`, {
      responseType,
    });
    
    return response.data;
  },

  // Get reorder report
  getInventoryReorder: async (filters: ReorderFilters = {}): Promise<ReorderReportResponse | Blob> => {
    const params = new URLSearchParams();
    
    if (filters.groupNumber) params.append('groupNumber', filters.groupNumber);
    if (filters.location) params.append('location', filters.location);
    if (filters.export) params.append('export', filters.export);

    const responseType = filters.export ? 'blob' : 'json';
    const response = await apiClient.get(`/reports/inventory/reorder?${params.toString()}`, {
      responseType,
    });
    
    return response.data;
  },

  // Helper function to download export as file
  downloadExport: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

