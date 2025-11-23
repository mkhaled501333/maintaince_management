import { apiClient } from '../api-client';
import { MaintenanceType } from '../types';

export const maintenanceTypeApi = {
  // List all maintenance types
  listMaintenanceTypes: async (category?: string, isActive: boolean = true): Promise<MaintenanceType[]> => {
    const params: Record<string, unknown> = { is_active: isActive };
    if (category) {
      params.category = category;
    }
    const response = await apiClient.get('/maintenance-types', { params });
    return response.data;
  },
  // Create maintenance type
  createMaintenanceType: async (data: { name: string; description?: string; category?: string; isActive?: boolean; }): Promise<MaintenanceType> => {
    const response = await apiClient.post('/maintenance-types', data);
    return response.data;
  },
};
