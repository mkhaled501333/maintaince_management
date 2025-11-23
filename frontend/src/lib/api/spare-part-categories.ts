import { apiClient } from '../api-client';
import { SparePartCategory } from '../types';

export const sparePartCategoriesApi = {
  getCategories: async (params: { isActive?: boolean; search?: string } = {}): Promise<SparePartCategory[]> => {
    const response = await apiClient.get('/spare-part-categories', {
      params: {
        isActive: params.isActive,
        search: params.search,
      },
    });
    return response.data;
  },
};

