import { apiClient } from '../api-client';
import { User, UserCreate, UserUpdate, UserListResponse, Department, DepartmentCreate, DepartmentUpdate } from '../types';

// User Management API
export const userApi = {
  // List users with pagination and filtering
  listUsers: async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    departmentId?: number;
  } = {}): Promise<UserListResponse> => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getUser: async (userId: number): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: UserCreate): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId: number, userData: UserUpdate): Promise<User> => {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (soft delete)
  deleteUser: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};

// Department Management API
export const departmentApi = {
  // List all departments
  listDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get('/departments');
    return response.data;
  },

  // Create new department
  createDepartment: async (departmentData: DepartmentCreate): Promise<Department> => {
    const response = await apiClient.post('/departments', departmentData);
    return response.data;
  },

  // Update department
  updateDepartment: async (departmentId: number, departmentData: DepartmentUpdate): Promise<Department> => {
    const response = await apiClient.put(`/departments/${departmentId}`, departmentData);
    return response.data;
  },

  // Delete department
  deleteDepartment: async (departmentId: number): Promise<void> => {
    await apiClient.delete(`/departments/${departmentId}`);
  },
};
