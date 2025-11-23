'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '@/lib/api/users';
import { Department, DepartmentCreate, DepartmentUpdate } from '@/lib/types';

export default function DepartmentManagementSection() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.listDepartments,
  });

  const createDepartmentMutation = useMutation({
    mutationFn: departmentApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowCreateForm(false);
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: ({ departmentId, departmentData }: { departmentId: number; departmentData: DepartmentUpdate }) =>
      departmentApi.updateDepartment(departmentId, departmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingDepartment(null);
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: departmentApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const handleCreateDepartment = (departmentData: DepartmentCreate | DepartmentUpdate) => {
    createDepartmentMutation.mutate(departmentData as DepartmentCreate);
  };

  const handleUpdateDepartment = (departmentId: number, departmentData: DepartmentUpdate) => {
    updateDepartmentMutation.mutate({ departmentId, departmentData });
  };

  const handleDeleteDepartment = (departmentId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      deleteDepartmentMutation.mutate(departmentId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-end">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            إنشاء قسم
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : departments?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    لا توجد أقسام
                  </td>
                </tr>
              ) : (
                departments?.map((department) => (
                  <tr key={department.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{department.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{department.description || 'لا يوجد وصف'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(department.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-3 text-sm">
                        <button
                          onClick={() => setEditingDepartment(department)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteDepartment(department.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          disabled={deleteDepartmentMutation.isPending}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateForm && (
        <DepartmentFormModal
          onSubmit={handleCreateDepartment}
          onClose={() => setShowCreateForm(false)}
          isLoading={createDepartmentMutation.isPending}
        />
      )}

      {editingDepartment && (
        <DepartmentFormModal
          department={editingDepartment}
          onSubmit={(departmentData) => handleUpdateDepartment(editingDepartment.id, departmentData)}
          onClose={() => setEditingDepartment(null)}
          isLoading={updateDepartmentMutation.isPending}
        />
      )}
    </div>
  );
}

interface DepartmentFormModalProps {
  department?: Department;
  onSubmit: (departmentData: DepartmentCreate | DepartmentUpdate) => void;
  onClose: () => void;
  isLoading: boolean;
}

function DepartmentFormModal({ department, onSubmit, onClose, isLoading }: DepartmentFormModalProps) {
  const [formData, setFormData] = useState({
    name: department?.name || '',
    description: department?.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold mb-4">{department ? 'تعديل القسم' : 'إنشاء قسم'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'جاري الحفظ...' : department ? 'تحديث' : 'إنشاء'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


