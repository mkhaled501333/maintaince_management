import { apiClient } from '../api-client';
import { FailureCode } from '../types';

export const failureCodeApi = {
  // List all failure codes
  listFailureCodes: async (category?: string, isActive: boolean = true): Promise<FailureCode[]> => {
    const params: Record<string, unknown> = { is_active: isActive };
    if (category) {
      params.category = category;
    }
    const response = await apiClient.get('/failure-codes', { params });
    return response.data;
  },
  // Create failure code
  createFailureCode: async (data: { code: string; description: string; category?: string; isActive?: boolean; }): Promise<FailureCode> => {
    const response = await apiClient.post('/failure-codes', data);
    return response.data;
  },
};
