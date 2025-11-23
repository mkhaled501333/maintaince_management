import { apiClient } from '../api-client';
import {
  SparePart,
  SparePartCreate,
  SparePartUpdate,
  SparePartListResponse,
  SparePartFilters,
} from '../types';

// Spare Parts Management API
export const sparePartsApi = {
  // List spare parts with pagination and filtering
  getSpareParts: async (filters: SparePartFilters = {}): Promise<SparePartListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId !== undefined) {
      const categoryValue = Array.isArray(filters.categoryId)
        ? filters.categoryId.join(',')
        : filters.categoryId.toString();
      params.append('categoryId', categoryValue);
    }
    if (filters.stockStatus) {
      const statusValue = Array.isArray(filters.stockStatus)
        ? filters.stockStatus.join(',')
        : filters.stockStatus;
      params.append('stock_status', statusValue);
    }
    if (filters.isActive !== undefined) params.append('is_active', filters.isActive.toString());
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.sortOrder) params.append('sort_order', filters.sortOrder);

    const response = await apiClient.get(`/spare-parts?${params.toString()}`);
    return response.data;
  },

  // Get spare part by ID
  getSparePart: async (partId: number): Promise<SparePart> => {
    const response = await apiClient.get(`/spare-parts/${partId}`);
    return response.data;
  },

  // Create new spare part
  createSparePart: async (sparePartData: SparePartCreate): Promise<SparePart> => {
    const response = await apiClient.post('/spare-parts', sparePartData);
    return response.data;
  },

  // Update spare part
  updateSparePart: async (partId: number, sparePartData: SparePartUpdate): Promise<SparePart> => {
    const response = await apiClient.patch(`/spare-parts/${partId}`, sparePartData);
    return response.data;
  },

  // Delete spare part (soft delete)
  deleteSparePart: async (partId: number): Promise<void> => {
    await apiClient.delete(`/spare-parts/${partId}`);
  },

  // Get available spare parts (active parts with stock > 0)
  getAvailableSpareParts: async (filters: SparePartFilters = {}): Promise<SparePartListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId !== undefined) {
      const categoryValue = Array.isArray(filters.categoryId)
        ? filters.categoryId.join(',')
        : filters.categoryId.toString();
      params.append('categoryId', categoryValue);
    }

    const response = await apiClient.get(`/spare-parts/available?${params.toString()}`);
    return response.data;
  },

  // Get low stock parts
  getLowStockParts: async (filters: SparePartFilters = {}): Promise<SparePartListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId !== undefined) {
      const categoryValue = Array.isArray(filters.categoryId)
        ? filters.categoryId.join(',')
        : filters.categoryId.toString();
      params.append('categoryId', categoryValue);
    }

    const response = await apiClient.get(`/spare-parts/low-stock?${params.toString()}`);
    return response.data;
  },
};

