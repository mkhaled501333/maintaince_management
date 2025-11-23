import { apiClient } from '../api-client';

export interface ActivityLog {
  id: number;
  userId: number;
  userName?: string;
  userFullName?: string;
  action: string;
  entityType: string;
  entityId: number;
  description?: string;
  oldValues?: string; // JSON string
  newValues?: string; // JSON string
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogListResponse {
  activityLogs: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ActivityLogFilters {
  page?: number;
  pageSize?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Activity Logs API
export const activityLogsApi = {
  // Get activity logs with pagination and filtering
  getActivityLogs: async (filters: ActivityLogFilters = {}): Promise<ActivityLogListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/activity-logs?${params.toString()}`);
    return response.data;
  },

  // Export activity logs to CSV
  exportActivityLogs: async (filters: ActivityLogFilters = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    
    if (filters.userId) params.append('userId', filters.userId.toString());
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/activity-logs/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

