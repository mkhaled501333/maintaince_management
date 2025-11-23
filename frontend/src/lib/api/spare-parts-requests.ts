import { apiClient } from '../api-client';
import {
  SparePartsRequest,
  SparePartsRequestCreate,
  SparePartsRequestListResponse,
  SparePartsRequestFilters,
  ApproveRequest,
  RejectRequest,
} from '../types';

// Spare Parts Requests API
export const sparePartsRequestsApi = {
  // List spare parts requests with pagination and filtering
  getRequests: async (filters: SparePartsRequestFilters = {}): Promise<SparePartsRequestListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.maintenanceWorkId) params.append('maintenanceWorkId', filters.maintenanceWorkId.toString());
    if (filters.sparePartId) params.append('sparePartId', filters.sparePartId.toString());
    if (filters.requestedBy) params.append('requestedBy', filters.requestedBy.toString());
    if (filters.isRequestedReturn !== undefined) params.append('isRequestedReturn', filters.isRequestedReturn.toString());
    if (filters.isReturned !== undefined) params.append('isReturned', filters.isReturned.toString());

    const response = await apiClient.get(`/spare-parts-requests?${params.toString()}`);
    return response.data;
  },

  // Get spare parts request by ID
  getRequest: async (requestId: number): Promise<SparePartsRequest> => {
    const response = await apiClient.get(`/spare-parts-requests/${requestId}`);
    return response.data;
  },

  // Create new spare parts request
  createRequest: async (requestData: SparePartsRequestCreate): Promise<SparePartsRequest> => {
    const response = await apiClient.post('/spare-parts-requests', requestData);
    return response.data;
  },

  // Approve a spare parts request
  approveRequest: async (requestId: number, approvalData: ApproveRequest): Promise<SparePartsRequest> => {
    const response = await apiClient.patch(`/spare-parts-requests/${requestId}/approve`, approvalData);
    return response.data;
  },

  // Reject a spare parts request
  rejectRequest: async (requestId: number, rejectionData: RejectRequest): Promise<SparePartsRequest> => {
    const response = await apiClient.patch(`/spare-parts-requests/${requestId}/reject`, rejectionData);
    return response.data;
  },

  // Issue approved spare parts
  issueRequest: async (requestId: number): Promise<SparePartsRequest> => {
    const response = await apiClient.patch(`/spare-parts-requests/${requestId}/issue`);
    return response.data;
  },

  // Request return of issued spare parts
  requestReturn: async (requestId: number): Promise<SparePartsRequest> => {
    const response = await apiClient.post(`/spare-parts-requests/${requestId}/return-request`);
    return response.data;
  },

  // Process return of spare parts
  processReturn: async (requestId: number): Promise<SparePartsRequest> => {
    const response = await apiClient.patch(`/spare-parts-requests/${requestId}/process-return`);
    return response.data;
  },
};

