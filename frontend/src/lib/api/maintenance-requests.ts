import { apiClient } from '../api-client';
import {
  MaintenanceRequest,
  MaintenanceRequestCreate,
  MaintenanceRequestListResponse,
  MaintenanceRequestFilters,
  RequestStatus,
} from '../types';

export const maintenanceRequestApi = {
  // Get maintenance requests with filtering and pagination
  getRequests: async (filters: MaintenanceRequestFilters = {}): Promise<MaintenanceRequestListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.machineId) params.append('machineId', filters.machineId.toString());
    if (filters.requestedById) params.append('requestedById', filters.requestedById.toString());
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/maintenance-requests?${params.toString()}`);
    return response.data;
  },

  // Get total count of active (unresolved) maintenance requests
  getActiveFaultsCount: async (): Promise<number> => {
    const activeStatuses: RequestStatus[] = [
      RequestStatus.PENDING,
      RequestStatus.IN_PROGRESS,
      RequestStatus.WAITING_PARTS,
    ];

    const responses = await Promise.all(
      activeStatuses.map((status) =>
        maintenanceRequestApi.getRequests({
          status,
          page: 1,
          limit: 1,
        })
      )
    );

    return responses.reduce((total, response) => total + response.total, 0);
  },

  // Create a new maintenance request
  createRequest: async (data: MaintenanceRequestCreate): Promise<MaintenanceRequest> => {
    const response = await apiClient.post('/maintenance-requests', data);
    return response.data;
  },

  // Get a maintenance request by ID
  getRequest: async (requestId: number): Promise<MaintenanceRequest> => {
    const response = await apiClient.get(`/maintenance-requests/${requestId}`);
    return response.data;
  },

  // Update maintenance request status
  updateStatus: async (requestId: number, status: string): Promise<MaintenanceRequest> => {
    const response = await apiClient.patch(`/maintenance-requests/${requestId}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  // Upload attachment for a maintenance request
  uploadAttachment: async (
    requestId: number, 
    file: File, 
    description?: string
  ): Promise<unknown> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post(
      `/maintenance-requests/${requestId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Technician-specific endpoints
  // Get available requests (PENDING status, no MaintenanceWork)
  getAvailableRequests: async (filters: MaintenanceRequestFilters = {}): Promise<MaintenanceRequestListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.machineId) params.append('machineId', filters.machineId.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/maintenance-requests/available?${params.toString()}`);
    return response.data;
  },

  // Get my work requests (IN_PROGRESS with technician's MaintenanceWork)
  getMyWorkRequests: async (filters: MaintenanceRequestFilters = {}): Promise<MaintenanceRequestListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/maintenance-requests/my-work?${params.toString()}`);
    return response.data;
  },

  // Accept a request
  acceptRequest: async (requestId: number): Promise<MaintenanceRequest> => {
    const response = await apiClient.post(`/maintenance-requests/${requestId}/accept`);
    return response.data;
  },
};
