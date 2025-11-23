import { apiClient } from '../api-client';
import { AttachmentBasicInfo } from '../types';

export type EntityType = 'MAINTENANCE_REQUEST' | 'MACHINE' | 'SPARE_PART' | 'PREVENTIVE_MAINTENANCE' | 'INVENTORY_TRANSACTION';

export interface UploadAttachmentParams {
  entityType: EntityType;
  entityId: number;
  file: File;
  description?: string;
}

export const attachmentsApi = {
  upload: async ({ entityType, entityId, file, description }: UploadAttachmentParams): Promise<AttachmentBasicInfo> => {
    const formData = new FormData();
    formData.append('entityType', entityType);
    formData.append('entityId', String(entityId));
    // Always send description, even if empty (FastAPI expects it as Optional Form field)
    formData.append('description', description || '');
    formData.append('file', file);

    // The request interceptor will automatically remove Content-Type for FormData
    // Axios will then set it correctly with boundary
    const response = await apiClient.post('/attachments/', formData);
    return response.data;
  },

  get: async (attachmentId: number): Promise<AttachmentBasicInfo> => {
    const response = await apiClient.get(`/attachments/${attachmentId}`);
    return response.data;
  },

  list: async (entityType?: EntityType, entityId?: number): Promise<AttachmentBasicInfo[]> => {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId != null) params.append('entityId', String(entityId));
    const query = params.toString();
    const response = await apiClient.get(`/attachments${query ? `?${query}` : ''}`);
    return response.data;
  },

  delete: async (attachmentId: number): Promise<void> => {
    await apiClient.delete(`/attachments/${attachmentId}`);
  },
};


