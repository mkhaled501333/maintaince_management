import { apiClient } from '../api-client';
import { WorkStatus } from '../types';

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

// Progress tracking schemas
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
  notes?: string;
}

export const maintenanceWorkApi = {
  // Get maintenance work by ID
  getWork: async (workId: number): Promise<MaintenanceWork> => {
    const response = await apiClient.get(`/maintenance-work/${workId}`);
    return response.data;
  },

  // Get maintenance work by request ID
  getWorkByRequest: async (requestId: number): Promise<MaintenanceWork | null> => {
    try {
      const response = await apiClient.get(`/maintenance-work/by-request/${requestId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 204 || error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Create maintenance work
  createWork: async (data: MaintenanceWorkCreate): Promise<MaintenanceWork> => {
    const response = await apiClient.post('/maintenance-work', data);
    return response.data;
  },

  // Update maintenance work (generic patch)
  updateWork: async (workId: number, data: MaintenanceWorkUpdate): Promise<MaintenanceWork> => {
    const response = await apiClient.patch(`/maintenance-work/${workId}`, data);
    return response.data;
  },

  // Start work
  startWork: async (workId: number, data: MaintenanceWorkStart): Promise<MaintenanceWork> => {
    const response = await apiClient.patch(`/maintenance-work/${workId}/start`, data);
    return response.data;
  },

  // Update progress (dedicated endpoint)
  updateProgress: async (workId: number, data: MaintenanceWorkProgressUpdate): Promise<MaintenanceWork> => {
    const response = await apiClient.patch(`/maintenance-work/${workId}/update-progress`, data);
    return response.data;
  },

  // Complete work
  completeWork: async (workId: number, data: MaintenanceWorkComplete): Promise<MaintenanceWork> => {
    const response = await apiClient.patch(`/maintenance-work/${workId}/complete`, data);
    return response.data;
  },
};

