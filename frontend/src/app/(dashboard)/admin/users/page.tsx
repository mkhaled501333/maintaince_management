'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/lib/api/users';
import { User, UserCreate, UserUpdate, UserRole } from '@/lib/types';
import { useAuth } from '@/lib/auth';

interface UserFilters {
  search: string;
  role: string;
  isActive: string;
}

export default function UserManagementPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    isActive: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', page, pageSize, filters],
    queryFn: () => userApi.listUsers({
      page,
      pageSize,
      search: filters.search || undefined,
      role: filters.role || undefined,
      isActive: filters.isActive ? filters.isActive === 'true' : undefined,
    }),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateForm(false);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: number; userData: UserUpdate }) =>
      userApi.updateUser(userId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: userApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleCreateUser = async (userData: UserCreate | UserUpdate) => {
    // Ensure all required fields are present for create operation
    if (!userData.username || !userData.fullName || !userData.password) {
      throw new Error('All fields are required for creating a user');
    }
    await createUserMutation.mutateAsync(userData as UserCreate);
  };

  const handleUpdateUser = async (userId: number, userData: UserUpdate) => {
    await updateUserMutation.mutateAsync({ userId, userData });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">تم رفض الوصول</h1>
          <p className="text-gray-600">تحتاج إلى صلاحيات المدير للوصول إلى هذه الصفحة.</p>
        </div>
      </div>
    );
  }

  const users = usersData?.users ?? [];
  const hasUsers = users.length > 0;

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow border border-gray-100 overflow-hidden h-full flex flex-col">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                إنشاء مستخدم
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white/60">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="البحث عن مستخدمين..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع الأدوار</option>
                  {Object.values(UserRole).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="px-6 py-6 bg-gray-50/80 flex-1 overflow-hidden">
            <div className="border border-gray-200 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
              {usersLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  جاري التحميل...
                </div>
              ) : !hasUsers ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  لا يوجد مستخدمون حالياً
                </div>
              ) : (
                <>
                  <div className="hidden md:flex md:flex-1 md:flex-col overflow-hidden">
                    <div className="overflow-auto">
                      <table className="w-full text-sm divide-y divide-gray-200">
                      <thead className="bg-white">
                        <tr className="text-gray-500 uppercase tracking-wide text-xs">
                          <th className="px-6 py-3 text-right">المستخدم</th>
                          <th className="px-6 py-3 text-right">الدور</th>
                          <th className="px-6 py-3 text-right">الحالة</th>
                          <th className="px-6 py-3 text-right">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-sm font-semibold text-gray-900">{user.fullName}</span>
                                <span className="text-xs text-gray-400">@{user.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {user.isActive ? 'نشط' : 'موقوف'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 text-sm">
                                <button
                                  onClick={() => setEditingUser(user)}
                                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                  تعديل
                                </button>
                                {user.id !== currentUser.id && (
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                  >
                                    حذف
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>

                  <div className="md:hidden flex-1 overflow-auto divide-y divide-gray-200 bg-white">
                    {users.map((user) => (
                      <div key={user.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          </div>
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                            {user.role}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">الحالة</span>
                          <span
                            className={`inline-flex px-2 py-1 rounded-full font-semibold ${
                              user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.isActive ? 'نشط' : 'موقوف'}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-4 text-sm">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            تعديل
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pagination */}
          {usersData && usersData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white/60">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, usersData.total)} of {usersData.total} results
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {page} of {usersData.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === usersData.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Form Modal */}
      {showCreateForm && (
        <UserFormModal
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateForm(false)}
          isLoading={createUserMutation.isPending}
        />
      )}

      {/* Edit User Form Modal */}
      {editingUser && (
        <UserFormModal
          user={editingUser}
          onSubmit={(userData) => handleUpdateUser(editingUser.id, userData)}
          onClose={() => setEditingUser(null)}
          isLoading={updateUserMutation.isPending}
        />
      )}
    </div>
  );
}

// User Form Modal Component
interface UserFormModalProps {
  user?: User;
  onSubmit: (userData: UserCreate | UserUpdate) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

function UserFormModal({ user, onSubmit, onClose, isLoading }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    password: '',
    role: user?.role || UserRole.MAINTENANCE_TECH,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>('');

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    
    try {
      const submitData = { ...formData };
      if (user && !submitData.password) {
        delete (submitData as any).password;
      }
      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.detail;
        const fieldErrors: Record<string, string> = {};
        
        validationErrors.forEach((err: any) => {
          const field = err.loc[err.loc.length - 1]; // Get the field name
          fieldErrors[field] = err.msg;
        });
        
        setErrors(fieldErrors);
      } else if (error.response?.status === 400) {
        // Handle business logic errors (duplicate username/email)
        const errorData = error.response.data.detail;
        if (typeof errorData === 'object' && errorData.field) {
          setErrors({ [errorData.field]: errorData.message });
        } else {
          setGeneralError(errorData.message || errorData);
        }
      } else {
        setGeneralError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Create User'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* General Error Message */}
            {generalError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {generalError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, username: e.target.value }));
                  clearFieldError('username');
                }}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, fullName: e.target.value }));
                  clearFieldError('fullName');
                }}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {user && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, password: e.target.value }));
                  clearFieldError('password');
                }}
                required={!user}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {Object.values(UserRole).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
