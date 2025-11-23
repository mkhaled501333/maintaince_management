'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { machineApi } from '@/lib/api/machines';
import { departmentApi } from '@/lib/api/users';
import { Machine, MachineCreate, MachineUpdate, MachineStatus, Department } from '@/lib/types';
import { machineStatusLabels } from '@/lib/locale';
import { useAuth } from '@/lib/auth';
import QRScanner from '@/components/qr-scanner/QRScanner';

interface MachineFilters {
  search: string;
  departmentId: string;
  status: string;
  location: string;
}

const statusColors: Record<MachineStatus, string> = {
  [MachineStatus.OPERATIONAL]: 'bg-green-100 text-green-800',
  [MachineStatus.DOWN]: 'bg-red-100 text-red-800',
  [MachineStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
  [MachineStatus.DECOMMISSIONED]: 'bg-gray-100 text-gray-800',
};

export default function MachineManagementPage() {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<MachineFilters>({
    search: '',
    departmentId: '',
    status: '',
    location: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [showQRCode, setShowQRCode] = useState<Machine | null>(null);

  // Fetch departments for dropdowns
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.listDepartments,
  });

  // Fetch machines
  const { data: machinesData, isLoading: machinesLoading } = useQuery({
    queryKey: ['machines', page, pageSize, filters],
    queryFn: () => machineApi.listMachines({
      page,
      pageSize,
      search: filters.search || undefined,
      departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
      status: filters.status as MachineStatus || undefined,
      location: filters.location || undefined,
    }),
  });

  // Create machine mutation
  const createMachineMutation = useMutation({
    mutationFn: machineApi.createMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setShowCreateForm(false);
    },
  });

  // Update machine mutation
  const updateMachineMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MachineUpdate }) =>
      machineApi.updateMachine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setEditingMachine(null);
    },
  });

  // Delete machine mutation
  const deleteMachineMutation = useMutation({
    mutationFn: machineApi.deleteMachine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
    },
  });

  const handleCreateMachine = async (data: MachineCreate) => {
    await createMachineMutation.mutateAsync(data);
  };

  const handleUpdateMachine = async (data: MachineUpdate) => {
    if (!editingMachine) return;
    await updateMachineMutation.mutateAsync({ id: editingMachine.id, data });
  };

  const handleDeleteMachine = async (machineId: number) => {
    if (confirm('هل أنت متأكد من حذف هذه الماكينة؟')) {
      try {
        await deleteMachineMutation.mutateAsync(machineId);
      } catch (error) {
        console.error('Failed to delete machine:', error);
      }
    }
  };

  const handleFilterChange = (key: keyof MachineFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-64">جاري التحميل...</div>;
  }

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'MAINTENANCE_MANAGER')) {
    return <div className="text-center text-red-600">تم رفض الوصول. يتطلب دور المدير أو مدير الصيانة.</div>;
  }

  const machines = machinesData?.machines ?? [];
  const hasMachines = machines.length > 0;

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow border border-gray-100 h-full flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">إدارة الماكينات</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              إضافة ماكينة
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white/60">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="البحث عن ماكينات..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <select
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">جميع الأقسام</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">جميع الحالات</option>
                  {Object.values(MachineStatus).map((status) => (
                    <option key={status} value={status}>
                      {machineStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="التصفية حسب الموقع..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Machines List */}
          <div className="px-6 py-6 bg-gray-50/80 flex-1 overflow-hidden">
            <div className="border border-gray-200 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
              {machinesLoading ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  جاري تحميل الماكينات...
                </div>
              ) : !hasMachines ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  لا توجد ماكينات حالياً
                </div>
              ) : (
                <>
                  <div className="hidden md:flex md:flex-col md:flex-1 overflow-hidden">
                    <div className="relative flex-1 overflow-auto">
                      <div className="min-w-full inline-block">
                        <table className="w-full text-sm divide-y divide-gray-200 min-w-[800px]">
                          <thead className="bg-white text-xs uppercase tracking-wide text-gray-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-4 lg:px-6 py-3 text-right bg-white whitespace-nowrap">الماكينة</th>
                              <th className="px-4 lg:px-6 py-3 text-right bg-white whitespace-nowrap">الطراز</th>
                              <th className="px-4 lg:px-6 py-3 text-right bg-white whitespace-nowrap">الرقم التسلسلي</th>
                              <th className="px-4 lg:px-6 py-3 text-right bg-white whitespace-nowrap">القسم</th>
                              <th className="px-4 lg:px-6 py-3 text-right bg-white whitespace-nowrap">الحالة</th>
                              <th className="px-4 lg:px-6 py-3 text-right bg-white whitespace-nowrap">الموقع</th>
                              <th className="px-4 lg:px-6 py-3 text-right bg-white whitespace-nowrap">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {machines.map((machine) => {
                              const department = departments.find((d) => d.id === machine.departmentId);
                              return (
                                <tr key={machine.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 lg:px-6 py-4">
                                    <div className="flex flex-col items-start gap-1">
                                      <a
                                        href={`/machines/${machine.id}`}
                                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                      >
                                        {machine.name}
                                      </a>
                                      <span className="text-xs text-gray-400">#{machine.id}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{machine.model || '-'}</td>
                                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{machine.serialNumber || '-'}</td>
                                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{department?.name || '-'}</td>
                                  <td className="px-4 lg:px-6 py-4">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[machine.status]}`}>
                                      {machineStatusLabels[machine.status]}
                                    </span>
                                  </td>
                                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{machine.location || '-'}</td>
                                  <td className="px-4 lg:px-6 py-4">
                                    <div className="flex items-center gap-2 lg:gap-3 text-sm flex-wrap">
                                      <a
                                        href={`/machines/${machine.id}`}
                                        className="text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
                                      >
                                        عرض
                                      </a>
                                      <button
                                        onClick={() => setEditingMachine(machine)}
                                        className="text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap"
                                      >
                                        تعديل
                                      </button>
                                      <button
                                        onClick={() => setShowQRCode(machine)}
                                        className="text-green-600 hover:text-green-800 transition-colors whitespace-nowrap"
                                      >
                                        رمز QR
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMachine(machine.id)}
                                        className="text-red-600 hover:text-red-800 transition-colors whitespace-nowrap"
                                      >
                                        حذف
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="md:hidden flex-1 overflow-auto divide-y divide-gray-200 bg-white">
                    {machines.map((machine) => {
                      const department = departments.find((d) => d.id === machine.departmentId);
                      return (
                        <div key={machine.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <a
                                href={`/machines/${machine.id}`}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                {machine.name}
                              </a>
                              <p className="text-xs text-gray-400 mt-0.5">#{machine.id}</p>
                            </div>
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusColors[machine.status]}`}>
                              {machineStatusLabels[machine.status]}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                            <div>
                              <span className="block text-gray-500 mb-1">الطراز</span>
                              <span>{machine.model || '-'}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 mb-1">الرقم التسلسلي</span>
                              <span>{machine.serialNumber || '-'}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 mb-1">القسم</span>
                              <span>{department?.name || '-'}</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 mb-1">الموقع</span>
                              <span>{machine.location || '-'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                            <a
                              href={`/machines/${machine.id}`}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                            >
                              عرض
                            </a>
                            <button
                              onClick={() => setEditingMachine(machine)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded hover:bg-indigo-50"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => setShowQRCode(machine)}
                              className="text-green-600 hover:text-green-800 transition-colors px-2 py-1 rounded hover:bg-green-50"
                            >
                              رمز QR
                            </button>
                            <button
                              onClick={() => handleDeleteMachine(machine.id)}
                              className="text-red-600 hover:text-red-800 transition-colors px-2 py-1 rounded hover:bg-red-50"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pagination */}
          {machinesData && machinesData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-white/60">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  عرض {Math.min((page - 1) * pageSize + 1, machinesData.total)} إلى{' '}
                  {Math.min(page * pageSize, machinesData.total)} من {machinesData.total} نتيجة
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <span className="text-sm text-gray-700">
                    صفحة {page} من {machinesData.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(machinesData.totalPages, page + 1))}
                    disabled={page === machinesData.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Machine Modal */}
      {showCreateForm && (
        <MachineForm
          departments={departments}
          onSubmit={(data) => handleCreateMachine(data as MachineCreate)}
          onClose={() => setShowCreateForm(false)}
          isLoading={createMachineMutation.isPending}
        />
      )}

      {/* Edit Machine Modal */}
      {editingMachine && (
        <MachineForm
          departments={departments}
          machine={editingMachine}
          onSubmit={(data) => handleUpdateMachine(data as MachineUpdate)}
          onClose={() => setEditingMachine(null)}
          isLoading={updateMachineMutation.isPending}
        />
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeModal
          machine={showQRCode}
          onClose={() => setShowQRCode(null)}
        />
      )}
    </div>
  );
}

// Machine Form Component
interface MachineFormProps {
  departments: Department[];
  machine?: Machine;
  onSubmit: (data: MachineCreate | MachineUpdate) => Promise<void> | void;
  onClose: () => void;
  isLoading: boolean;
}

function MachineForm({ departments, machine, onSubmit, onClose, isLoading }: MachineFormProps) {
  const [formData, setFormData] = useState<MachineCreate>({
    name: machine?.name || '',
    model: machine?.model || '',
    serialNumber: machine?.serialNumber || '',
    departmentId: machine?.departmentId || departments[0]?.id || 0,
    location: machine?.location || '',
    installationDate: machine?.installationDate || '',
    status: machine?.status || MachineStatus.OPERATIONAL,
    qrCode: machine?.qrCode || '',
  });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    // Validate required fields
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'يجب أن يكون اسم الماكينة مكوناً من حرفين على الأقل';
    }
    
    if (!formData.departmentId || formData.departmentId === 0) {
      newErrors.departmentId = 'يرجى اختيار قسم';
    }
    
    // Validate optional fields if they have values
    if (formData.model && formData.model.trim().length === 0) {
      newErrors.model = 'لا يمكن أن يكون حقل الطراز فارغاً عند إدخاله';
    }
    
    if (formData.serialNumber && formData.serialNumber.trim().length === 0) {
      newErrors.serialNumber = 'لا يمكن أن يكون الرقم التسلسلي فارغاً عند إدخاله';
    }
    
    if (formData.location && formData.location.trim().length === 0) {
      newErrors.location = 'لا يمكن أن يكون الموقع فارغاً عند إدخاله';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    try {
      if (machine) {
        // Convert to MachineUpdate (all fields optional except what we're editing)
        const updateData: MachineUpdate = {
          name: formData.name,
          model: formData.model || undefined,
          serialNumber: formData.serialNumber || undefined,
          departmentId: formData.departmentId,
          location: formData.location || undefined,
          installationDate: formData.installationDate || undefined,
          status: formData.status,
        };
        await onSubmit(updateData);
      } else {
        // Convert to MachineCreate - convert empty strings to undefined for optional fields
        const createData: MachineCreate = {
          name: formData.name,
          departmentId: formData.departmentId,
          status: formData.status,
          // Only include optional fields if they have non-empty values
          ...(formData.model && formData.model.trim() !== '' ? { model: formData.model } : {}),
          ...(formData.serialNumber && formData.serialNumber.trim() !== '' ? { serialNumber: formData.serialNumber } : {}),
          ...(formData.location && formData.location.trim() !== '' ? { location: formData.location } : {}),
          ...(formData.installationDate ? { installationDate: formData.installationDate } : {}),
          ...(formData.qrCode && formData.qrCode.trim() !== '' ? { qrCode: formData.qrCode } : {}),
        };
        await onSubmit(createData);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      console.error('Error response:', error?.response);
      console.error('Error response data:', error?.response?.data);
      
      // Handle validation errors from backend
      if (error?.response?.data?.detail) {
        console.log('Error detail:', error.response.data.detail);
        if (typeof error.response.data.detail === 'string') {
          console.log('Setting submit error to:', error.response.data.detail);
          setSubmitError(error.response.data.detail);
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle multiple validation errors
          const errorMessages = error.response.data.detail.map((err: any) => err.msg || err.message).join(', ');
          console.log('Setting submit error to:', errorMessages);
          setSubmitError(errorMessages);
        } else if (typeof error.response.data.detail === 'object') {
          // Handle field-specific errors
          const errorObj = error.response.data.detail;
          const fieldErrors: { [key: string]: string } = {};
          
          Object.keys(errorObj).forEach((key) => {
            if (Array.isArray(errorObj[key])) {
              fieldErrors[key] = errorObj[key][0];
            }
          });
          
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
          } else {
            const errorString = JSON.stringify(errorObj);
            console.log('Setting submit error to:', errorString);
            setSubmitError(errorString);
          }
        }
      } else if (error?.response?.status === 400) {
        console.log('Setting generic 400 error');
        setSubmitError('بيانات غير صالحة. يرجى التحقق من الإدخالات والمحاولة مجدداً.');
      } else {
        console.log('Setting generic error');
        setSubmitError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleScanSuccess = (qrCode: string) => {
    setFormData({ ...formData, qrCode });
    setShowQRScanner(false);
  };

  const handleScanError = (error: string) => {
    console.error('QR Scan error:', error);
    setShowQRScanner(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Mobile: Full screen modal */}
      <div className="md:hidden w-full h-full bg-white flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h3 className="text-xl font-semibold text-gray-900">
            {machine ? 'تعديل الماكينة' : 'إنشاء ماكينة'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="إغلاق"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Submit Error Display */}
          {submitError && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-500 rounded-lg shadow-sm">
              <div className="flex items-start">
                <svg className="flex-shrink-0 w-6 h-6 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="mr-3">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">خطأ في التحقق</h4>
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} id="mobile-machine-form" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.name 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الطراز</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                  if (errors.model) setErrors({ ...errors, model: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.model 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الرقم التسلسلي</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => {
                  setFormData({ ...formData, serialNumber: e.target.value });
                  if (errors.serialNumber) setErrors({ ...errors, serialNumber: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.serialNumber 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.serialNumber && <p className="mt-1 text-xs text-red-600">{errors.serialNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رمز QR (اختياري)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="أدخل رمز QR أو امسحه"
                  value={formData.qrCode}
                  onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowQRScanner(true)}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap transition-colors"
                >
                  مسح
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                اتركه فارغاً لإنشاء رمز QR تلقائياً
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القسم *</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => {
                  setFormData({ ...formData, departmentId: parseInt(e.target.value) });
                  if (errors.departmentId) setErrors({ ...errors, departmentId: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.departmentId 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="">اختر القسم</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (errors.location) setErrors({ ...errors, location: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.location 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ التركيب</label>
              <input
                type="date"
                value={formData.installationDate}
                onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {Object.values(MachineStatus).map((status) => (
                  <option key={status} value={status}>
                    {machineStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
        
        {/* Mobile Footer */}
        <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="mobile-machine-form"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'جاري الحفظ...' : machine ? 'تحديث' : 'إنشاء'}
          </button>
        </div>
      </div>

      {/* Desktop/Tablet: Side Panel */}
      <div 
        className="hidden md:flex md:flex-col md:w-full md:max-w-lg lg:max-w-xl h-full bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desktop Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <h3 className="text-2xl font-semibold text-gray-900">
            {machine ? 'تعديل الماكينة' : 'إنشاء ماكينة'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="إغلاق"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Desktop Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Submit Error Display */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg shadow-sm">
              <div className="flex items-start">
                <svg className="flex-shrink-0 w-6 h-6 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="mr-3">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">خطأ في التحقق</h4>
                  <p className="text-sm font-medium text-red-800">{submitError}</p>
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} id="machine-form" className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الاسم *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.name 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الطراز</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => {
                  setFormData({ ...formData, model: e.target.value });
                  if (errors.model) setErrors({ ...errors, model: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.model 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.model && <p className="mt-1 text-xs text-red-600">{errors.model}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الرقم التسلسلي</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => {
                  setFormData({ ...formData, serialNumber: e.target.value });
                  if (errors.serialNumber) setErrors({ ...errors, serialNumber: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.serialNumber 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.serialNumber && <p className="mt-1 text-xs text-red-600">{errors.serialNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رمز QR (اختياري)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="أدخل رمز QR أو امسحه"
                  value={formData.qrCode}
                  onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowQRScanner(true)}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap transition-colors"
                >
                  مسح
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                اتركه فارغاً لإنشاء رمز QR تلقائياً
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">القسم *</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => {
                  setFormData({ ...formData, departmentId: parseInt(e.target.value) });
                  if (errors.departmentId) setErrors({ ...errors, departmentId: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.departmentId 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              >
                <option value="">اختر القسم</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="mt-1 text-xs text-red-600">{errors.departmentId}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الموقع</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (errors.location) setErrors({ ...errors, location: '' });
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                  errors.location 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {errors.location && <p className="mt-1 text-xs text-red-600">{errors.location}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ التركيب</label>
              <input
                type="date"
                value={formData.installationDate}
                onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                {Object.values(MachineStatus).map((status) => (
                  <option key={status} value={status}>
                    {machineStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>
        
        {/* Desktop Footer */}
        <div className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="machine-form"
            disabled={isLoading}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'جاري الحفظ...' : machine ? 'تحديث' : 'إنشاء'}
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onError={handleScanError}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}

// QR Code Modal Component
interface QRCodeModalProps {
  machine: Machine;
  onClose: () => void;
}

function QRCodeModal({ machine, onClose }: QRCodeModalProps) {
  const { data: qrData, isLoading } = useQuery({
    queryKey: ['machine-qr', machine.id],
    queryFn: () => machineApi.getMachineQRCode(machine.id, 300),
  });

  const downloadQRCode = () => {
    if (qrData?.qrCodeImage) {
      const link = document.createElement('a');
      link.href = qrData.qrCodeImage;
      link.download = `ماكينة-${machine.name}-رمز-QR.png`;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            رمز QR - {machine.name}
          </h3>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">جاري تحميل رمز QR...</div>
          ) : qrData ? (
            <div className="text-center">
              <img
                src={qrData.qrCodeImage}
                alt={`رمز QR للماكينة ${machine.name}`}
                className="mx-auto mb-4"
              />
              <p className="text-sm text-gray-600 mb-4">
                رمز QR: {qrData.qrCode}
              </p>
              <button
                onClick={downloadQRCode}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                تحميل رمز QR
              </button>
            </div>
          ) : (
            <div className="text-center text-red-600">فشل تحميل رمز QR</div>
          )}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
