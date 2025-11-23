import { apiClient } from '../api-client';
import { 
  Machine, 
  MachineCreate, 
  MachineUpdate, 
  MachineListResponse, 
  MachineStatus,
  MachineStatusSummaryResponse,
  QRCodeResponse,
  MachineDetailResponse 
} from '../types';

// Machine Management API
export const machineApi = {
  // List machines with pagination and filtering
  listMachines: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    departmentId?: number;
    status?: MachineStatus;
    location?: string;
  } = {}): Promise<MachineListResponse> => {
    const response = await apiClient.get('/machines', { params });
    return response.data;
  },

  // Get summary of machines by status
  getStatusSummary: async (statuses?: MachineStatus[]): Promise<MachineStatusSummaryResponse> => {
    const params: Record<string, MachineStatus[] | undefined> = {};
    if (statuses?.length) {
      params.status = statuses;
    }
    const response = await apiClient.get('/machines/status-summary', { params });
    return response.data;
  },

  // Get total machines matching provided statuses
  countByStatuses: async (statuses: MachineStatus[]): Promise<number> => {
    const summary = await machineApi.getStatusSummary(statuses);
    return statuses.reduce((total, status) => total + (summary.counts?.[status] ?? 0), 0);
  },

  // Get machine by ID
  getMachine: async (machineId: number): Promise<Machine> => {
    const response = await apiClient.get(`/machines/${machineId}`);
    return response.data;
  },

  // Create new machine
  createMachine: async (machineData: MachineCreate): Promise<Machine> => {
    console.log('Creating machine with data:', JSON.stringify(machineData, null, 2));
    try {
      const response = await apiClient.post('/machines', machineData);
      return response.data;
    } catch (error: any) {
      console.error('API error:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      throw error; // Re-throw to let the form handle it
    }
  },

  // Update machine
  updateMachine: async (machineId: number, machineData: MachineUpdate): Promise<Machine> => {
    const response = await apiClient.patch(`/machines/${machineId}`, machineData);
    return response.data;
  },

  // Delete machine
  deleteMachine: async (machineId: number): Promise<void> => {
    await apiClient.delete(`/machines/${machineId}`);
  },

  // Get QR code for machine
  getMachineQRCode: async (machineId: number, size?: number): Promise<QRCodeResponse> => {
    const response = await apiClient.get(`/machines/${machineId}/qr-code`, {
      params: size ? { size } : {}
    });
    return response.data;
  },

  // Get machine by QR code (for mobile scanning)
  getMachineByQRCode: async (qrCode: string): Promise<Machine> => {
    // Encode QR code to handle special characters, spaces, and Unicode
    const encodedQrCode = encodeURIComponent(qrCode);
    const response = await apiClient.get(`/machines/qr/${encodedQrCode}`);
    return response.data;
  },

  // Get comprehensive machine detail with history, spare parts, and attachments
  getMachineDetail: async (
    machineId: number,
    params?: {
      includeHistory?: boolean;
      page?: number;
      pageSize?: number;
    }
  ): Promise<MachineDetailResponse> => {
    try {
      console.log('Fetching machine detail for ID:', machineId);
      const response = await apiClient.get(`/machines/${machineId}/detail`, { params });
      console.log('Machine detail response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching machine detail:', error);
      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error;
    }
  },
};
