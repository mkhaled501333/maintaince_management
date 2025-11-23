'use client';

import { useAuth } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Machine, MachineStatus, SparePartsRequestStatus, RequestStatus, UserRole } from '@/lib/types';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRScanner from '@/components/qr-scanner/QRScanner';
import MachineDisplay from '@/components/qr-scanner/MachineDisplay';
import { machineApi } from '@/lib/api/machines';
import { maintenanceRequestApi } from '@/lib/api/maintenance-requests';
import { sparePartsRequestsApi } from '@/lib/api/spare-parts-requests';
import ClientOnly from '@/components/ClientOnly';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedMachine, setScannedMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get stopped machines count (DOWN only)
  const {
    data: stoppedMachinesCount,
    isLoading: isStoppedMachinesLoading,
    isError: isStoppedMachinesError,
  } = useQuery({
    queryKey: ['home-dashboard', 'stopped-machines'],
    queryFn: () => machineApi.countByStatuses([MachineStatus.DOWN]),
    refetchInterval: 30000,
  });

  // Get machines under maintenance count (MAINTENANCE only)
  const {
    data: maintenanceMachinesCount,
    isLoading: isMaintenanceMachinesLoading,
    isError: isMaintenanceMachinesError,
  } = useQuery({
    queryKey: ['home-dashboard', 'maintenance-machines'],
    queryFn: () => machineApi.countByStatuses([MachineStatus.MAINTENANCE]),
    refetchInterval: 30000,
  });

  const stoppedMachinesDisplay = isStoppedMachinesLoading ? '...' : stoppedMachinesCount ?? 0;
  const maintenanceMachinesDisplay = isMaintenanceMachinesLoading ? '...' : maintenanceMachinesCount ?? 0;
  const {
    data: pendingSparePartsRequestsCount,
    isLoading: isPendingSparePartsRequestsLoading,
    isError: isPendingSparePartsRequestsError,
  } = useQuery({
    queryKey: ['home-dashboard', 'pending-spare-parts-requests'],
    queryFn: async () => {
      const response = await sparePartsRequestsApi.getRequests({
        status: 'PENDING' as SparePartsRequestStatus,
        pageSize: 1,
      });
      return response.total;
    },
    refetchInterval: 30000,
  });
  const pendingSparePartsRequestsDisplay = isPendingSparePartsRequestsLoading
    ? '...'
    : pendingSparePartsRequestsCount ?? 0;

  // Get approved spare parts requests count (for Inventory Managers)
  const {
    data: approvedSparePartsRequestsCount,
    isLoading: isApprovedSparePartsRequestsLoading,
    isError: isApprovedSparePartsRequestsError,
  } = useQuery({
    queryKey: ['home-dashboard', 'approved-spare-parts-requests'],
    queryFn: async () => {
      const response = await sparePartsRequestsApi.getRequests({
        status: 'APPROVED' as SparePartsRequestStatus,
        pageSize: 1,
      });
      return response.total;
    },
    refetchInterval: 30000,
    enabled: user?.role === UserRole.INVENTORY_MANAGER || user?.role === UserRole.ADMIN,
  });
  const approvedSparePartsRequestsDisplay = isApprovedSparePartsRequestsLoading
    ? '...'
    : approvedSparePartsRequestsCount ?? 0;

  // Get available requests count (PENDING without MaintenanceWork)
  const {
    data: availableRequestsCount,
    isLoading: isAvailableRequestsLoading,
    isError: isAvailableRequestsError,
  } = useQuery({
    queryKey: ['home-dashboard', 'available-requests-count'],
    queryFn: async () => {
      const response = await maintenanceRequestApi.getAvailableRequests({
        status: RequestStatus.PENDING,
        page: 1,
        limit: 1,
      });
      return response.total;
    },
    refetchInterval: 30000,
    enabled: user?.role === UserRole.MAINTENANCE_MANAGER || user?.role === UserRole.ADMIN || user?.role === UserRole.MAINTENANCE_TECH,
  });

  // Get my work requests count (IN_PROGRESS and WAITING_PARTS with MaintenanceWork)
  const {
    data: myWorkRequestsCount,
    isLoading: isMyWorkRequestsLoading,
    isError: isMyWorkRequestsError,
  } = useQuery({
    queryKey: ['home-dashboard', 'my-work-requests-count'],
    queryFn: async () => {
      const response = await maintenanceRequestApi.getMyWorkRequests({
        page: 1,
        limit: 1,
      });
      return response.total;
    },
    refetchInterval: 30000,
    enabled: user?.role === UserRole.MAINTENANCE_MANAGER || user?.role === UserRole.ADMIN || user?.role === UserRole.MAINTENANCE_TECH,
  });

  const availableRequestsDisplay = isAvailableRequestsLoading ? '...' : availableRequestsCount ?? 0;
  const myWorkRequestsDisplay = isMyWorkRequestsLoading ? '...' : myWorkRequestsCount ?? 0;
  const totalMaintenanceDisplay = (availableRequestsCount ?? 0) + (myWorkRequestsCount ?? 0);

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'مدير النظام';
      case UserRole.SUPERVISOR:
        return 'مشرف';
      case UserRole.MAINTENANCE_TECH:
        return 'فني صيانة';
      case UserRole.MAINTENANCE_MANAGER:
        return 'مدير الصيانة';
      case UserRole.INVENTORY_MANAGER:
        return 'مدير المخزون';
      default:
        return role;
    }
  };

  const handleScanSuccess = async (qrCodeData: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('QR Code scanned:', qrCodeData);
      
      // Parse QR code data to extract the QR code identifier
      let qrCodeIdentifier = qrCodeData.trim();
      
      // Check if the QR code follows the old format with machine prefix
      if (qrCodeData.includes(':')) {
        const parts = qrCodeData.split(':');
        if (parts.length >= 3 && parts[0] === 'machine') {
          qrCodeIdentifier = parts.slice(2).join(':');
          console.log('Extracted QR code identifier from old format:', qrCodeIdentifier);
        }
      }
      
      // Try to use the QR code to fetch machine data
      let machine: Machine;
      try {
        machine = await machineApi.getMachineByQRCode(qrCodeIdentifier);
        console.log('Machine found by QR code:', machine);
      } catch (qrError) {
        // If QR code lookup fails, try searching by name (for legacy QR codes)
        console.log('QR code lookup failed, trying to search by name:', qrCodeIdentifier);
        const searchResults = await machineApi.listMachines({ search: qrCodeIdentifier, pageSize: 10 });
        
        if (searchResults.machines.length > 0) {
          machine = searchResults.machines[0];
          console.log('Machine found by name search:', machine);
        } else {
          throw new Error('لم يتم العثور على الماكينة. يرجى التحقق من رمز QR أو إعادة المحاولة.');
        }
      }
      
      setScannedMachine(machine);
      setShowScanner(false);
    } catch (err) {
      console.error('Error fetching machine data:', err);
      const errorMessage = err instanceof Error ? err.message : 'فشل تحميل معلومات الماكينة. يرجى إعادة المسح مرة أخرى.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanError = (error: string) => {
    console.error('QR Scanner error:', error);
    setError(error);
  };

  const handleMachineAction = (action: string) => {
    console.log('Machine action:', action, scannedMachine);
    
    switch (action) {
      case 'report-problem':
        if (scannedMachine) {
          window.location.href = `/maintenance/report?machineId=${scannedMachine.id}`;
        }
        break;
      case 'view-history':
        alert('ميزة سجل الماكينة قريباً!');
        break;
      case 'scan-another':
        setScannedMachine(null);
        setShowScanner(true);
        setError(null);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setError(null);
  };

  const handleCloseMachineDisplay = () => {
    setScannedMachine(null);
    setError(null);
  };

  const startScanning = () => {
    setShowScanner(true);
    setError(null);
    setScannedMachine(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-xl border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-white">
                    إدارة الصيانة
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="hidden sm:flex flex-col items-end">
                  <div className="text-sm font-semibold text-gray-100">
                    مرحباً، {user?.fullName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {user && getRoleDisplayName(user.role)}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 font-medium"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Stats Cards for Technician, Maintenance Manager and Admin */}
          {(user?.role === UserRole.MAINTENANCE_TECH || user?.role === UserRole.MAINTENANCE_MANAGER || user?.role === UserRole.ADMIN) && (
            <div className="px-4 sm:px-0 mb-6">
              <div className={`grid ${user?.role === UserRole.MAINTENANCE_TECH ? 'grid-cols-1 gap-4 max-w-md' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                <Link href="/maintenance/dashboard" className="block">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow hover:border-indigo-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="text-right flex-1">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">الأعطال الحالية:</span>
                            <span className="text-lg font-bold text-gray-900">
                              {availableRequestsDisplay}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {user?.role === UserRole.MAINTENANCE_TECH ? 'أعمالي:' : 'الأعمال:'}
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {myWorkRequestsDisplay}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-indigo-100 rounded-lg p-3 mr-3">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                    </div>
                    {(isAvailableRequestsError || isMyWorkRequestsError) && (
                      <p className="text-xs text-red-500 mt-3">
                        تعذر تحميل عدد طلبات الصيانة
                      </p>
                    )}
                  </div>
                </Link>

                {/* Additional cards for Maintenance Manager and Admin only */}
                {(user?.role === UserRole.MAINTENANCE_MANAGER || user?.role === UserRole.ADMIN) && (
                  <>
                    <Link href="/machines?status=DOWN" className="block">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow hover:border-red-300 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="text-right flex-1">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">الماكينات المتوقفة:</span>
                                <span className="text-lg font-bold text-gray-900">
                                  {stoppedMachinesDisplay}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">ماكينات تحت الصيانة:</span>
                                <span className="text-lg font-bold text-gray-900">
                                  {maintenanceMachinesDisplay}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-red-100 rounded-lg p-3 mr-3">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2m-6 0H7a2 2 0 01-2-2V6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v0" />
                            </svg>
                          </div>
                        </div>
                        {(isStoppedMachinesError || isMaintenanceMachinesError) && (
                          <p className="text-xs text-red-500 mt-3">
                            تعذر تحميل عدد الماكينات
                          </p>
                        )}
                      </div>
                    </Link>

                    <Link href="/maintenance/spare-parts-requests" className="block">
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow hover:border-blue-300 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-600">
                              طلبات قطع الغيار المعلقة
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {pendingSparePartsRequestsDisplay}
                            </p>
                          </div>
                          <div className="bg-blue-100 rounded-lg p-3">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 7h18M5 7l1.68 10.08A2 2 0 008.66 19h6.68a2 2 0 001.98-1.92L19 7M9 11v4m3-4v4m3-4v4"
                              />
                            </svg>
                          </div>
                        </div>
                        {isPendingSparePartsRequestsError && (
                          <p className="text-xs text-red-500 mt-3">
                            تعذر تحميل عدد طلبات قطع الغيار
                          </p>
                        )}
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Stats Cards for Inventory Manager and Admin */}
          {(user?.role === UserRole.INVENTORY_MANAGER || user?.role === UserRole.ADMIN) && (
            <div className="px-4 sm:px-0 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/inventory/approved-requests" className="block">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow hover:border-orange-300 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="text-right flex-1">
                        <p className="text-xs font-medium text-gray-600">
                          طلبات قطع الغيار
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {approvedSparePartsRequestsDisplay}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          طلبات معتمدة بانتظار الصرف
                        </p>
                      </div>
                      <div className="bg-orange-100 rounded-lg p-3">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    {isApprovedSparePartsRequestsError && (
                      <p className="text-xs text-red-500 mt-3">
                        تعذر تحميل عدد طلبات قطع الغيار المعتمدة
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          )}

          <div className="px-4 py-6 sm:px-0">
            <div className={`grid ${(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.MAINTENANCE_TECH) ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-8`}>
              {/* User Info Card - Hidden for Supervisor, Technician, Maintenance Manager, and Inventory Manager */}
              {user?.role !== UserRole.SUPERVISOR && user?.role !== UserRole.MAINTENANCE_TECH && user?.role !== UserRole.MAINTENANCE_MANAGER && user?.role !== UserRole.INVENTORY_MANAGER && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      معلومات المستخدم
                    </h3>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p><span className="font-medium">الاسم:</span> {user?.fullName}</p>
                      <p><span className="font-medium">اسم المستخدم:</span> {user?.username}</p>
                      <p><span className="font-medium">الدور:</span> {user && getRoleDisplayName(user.role)}</p>
                      <p><span className="font-medium">الحالة:</span> {user?.isActive ? 'نشط' : 'غير نشط'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Functions */}
              {user?.role === UserRole.ADMIN && (
                <>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        إدارة المستخدمين
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        إدارة مستخدمي النظام والأدوار والصلاحيات
                      </p>
                      <a
                        href="/admin/users"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        إدارة المستخدمين
                      </a>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        إدارة الأقسام
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        إنشاء وإدارة أقسام المؤسسة
                      </p>
                      <a
                        href="/admin/departments"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        إدارة الأقسام
                      </a>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        إدارة الماكينات
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        إدارة الماكينات، وإنشاء رموز QR، وتتبع الصيانة
                      </p>
                      <a
                        href="/machines"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                      >
                        إدارة الماكينات
                      </a>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        سجلات النشاط
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        عرض وتصدير سجلات نشاط النظام للمراجعة والامتثال
                      </p>
                      <a
                        href="/admin/activity-logs"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        عرض سجلات النشاط
                      </a>
                    </div>
                  </div>

                  {/* New Admin Cards */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        أكواد الأعطال
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        إنشاء وإدارة أكواد الأعطال الموحدة
                      </p>
                      <a
                        href="/admin/failure-codes"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700"
                      >
                        إدارة أكواد الأعطال
                      </a>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        أنواع الصيانة
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        تحديد أنواع الصيانة المستخدمة في الطلبات والتقارير
                      </p>
                      <a
                        href="/admin/maintenance-types"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
                      >
                        إدارة أنواع الصيانة
                      </a>
                    </div>
                  </div>

                </>
              )}


              {/* Inventory Management (Inventory Managers & Admins) */}
              {(user?.role === UserRole.INVENTORY_MANAGER || user?.role === UserRole.ADMIN) && (
                <>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        مخزون قطع الغيار
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        إدارة قطع الغيار، وتتبع مستويات المخزون، وعرض تنبيهات المخزون المنخفض
                      </p>
                      <a
                        href="/inventory/spare-parts"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        إدارة المخزون
                      </a>
                    </div>
                  </div>

                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        تحليلات المخزون
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        عرض التقارير الشاملة حول مستويات المخزون والاستهلاك والتقييم واحتياجات إعادة الطلب
                      </p>
                      <a
                        href="/analytics/inventory"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        عرض التحليلات
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* All Transactions (Inventory Managers & Admins) */}
              {(user?.role === UserRole.INVENTORY_MANAGER || user?.role === UserRole.ADMIN) && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      جميع المعاملات
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      عرض وإدارة جميع معاملات المخزون بما في ذلك حركات المخزون والتعديلات
                    </p>
                    <a
                      href="/inventory/transactions"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      عرض المعاملات
                    </a>
                  </div>
                </div>
              )}

              {/* Maintenance Request Dashboard (Managers) */}
              {(user?.role === UserRole.MAINTENANCE_MANAGER || user?.role === UserRole.ADMIN) && (
                <>
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        تحليلات الصيانة
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        عرض التحليلات حول وقت التوقف والتكاليف وأنماط الأعطال
                      </p>
                      <a
                        href="/analytics/maintenance"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        عرض التحليلات
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* QR Scanner - Supervisor and Technician have direct scan icon, others have link */}
              {(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.MAINTENANCE_TECH) ? (
                <div className="relative bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:border-purple-400 hover:shadow-xl transition-all duration-300 group">
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative px-5 py-6 text-center">
                    {/* Header */}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-white transition-colors duration-300 mb-2">
                      ماسح رمز QR
                    </h3>
                    <p className="text-xs text-gray-600 group-hover:text-purple-100 transition-colors duration-300 mb-4">
                      مسح رموز QR الخاصة بالماكينات
                    </p>

                    {/* Main Scan Button */}
                    <button
                      onClick={startScanning}
                      className="relative w-full flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-300 group/btn overflow-hidden"
                    >
                      {/* Button Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 group-hover/btn:from-purple-500 group-hover/btn:to-indigo-500 rounded-xl transition-all duration-300"></div>
                      
                      {/* Modern QR Code Icon */}
                      <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-lg group-hover/btn:shadow-purple-500/50 transform group-hover/btn:scale-105 transition-all duration-300">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zM14 3h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zM16 14h1v1h-1v-1zm2 0h1v1h-1v-1zm-1 1h1v1h-1v-1zm1 2h1v1h-1v-1zm2-2h1v1h-1v-1zm0 2h1v1h-1v-1zm-1 1h1v1h-1v-1zm-2 1h1v1h-1v-1zm2 0h1v1h-1v-1zm3-3h1v1h-1v-1zm0 3h1v1h-1v-1z" />
                        </svg>
                      </div>
                      
                      {/* Button Text */}
                      <span className="relative z-10 text-sm font-semibold text-purple-700 group-hover/btn:text-white transition-colors duration-300">
                        اضغط للمسح
                      </span>
                    </button>

                    {/* Error Message */}
                    {error && (
                      <div className="mt-4 relative z-10 bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm">
                        <div className="flex items-start">
                          <svg className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-red-800 text-xs font-medium">{error}</p>
                            <button
                              onClick={() => setError(null)}
                              className="text-red-600 hover:text-red-800 text-xs mt-1 font-semibold underline transition-colors"
                            >
                              إغلاق
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      ماسح رمز QR
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      مسح رموز QR الخاصة بالماكينات للوصول إلى المعلومات والإبلاغ عن المشاكل
                    </p>
                    <a
                      href="/qr-scanner"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      فتح الماسح
                    </a>
                  </div>
                </div>
              )}

              {/* Quick Actions - Hidden for Supervisor, Technician, Maintenance Manager, and Inventory Manager */}
              {user?.role !== UserRole.SUPERVISOR && user?.role !== UserRole.MAINTENANCE_TECH && user?.role !== UserRole.MAINTENANCE_MANAGER && user?.role !== UserRole.INVENTORY_MANAGER && (
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      إجراءات سريعة
                    </h3>
                    <div className="space-y-2">
                      <a
                        href="/maintenance/dashboard"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        عرض طلبات الصيانة
                      </a>
                      <a
                        href="/inventory/spare-parts"
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        التحقق من المخزون
                      </a>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                        إنشاء التقارير
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* QR Scanner Modal - For Supervisor and Technician */}
        {(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.MAINTENANCE_TECH) && showScanner && (
          <ClientOnly>
            <QRScanner
              onScanSuccess={handleScanSuccess}
              onError={handleScanError}
              onClose={handleCloseScanner}
            />
          </ClientOnly>
        )}

        {/* Machine Display Modal - For Supervisor and Technician */}
        {(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.MAINTENANCE_TECH) && scannedMachine && (
          <ClientOnly>
            <MachineDisplay
              machine={scannedMachine}
              onAction={handleMachineAction}
              onClose={handleCloseMachineDisplay}
            />
          </ClientOnly>
        )}

        {/* Loading State - For Supervisor and Technician */}
        {(user?.role === UserRole.SUPERVISOR || user?.role === UserRole.MAINTENANCE_TECH) && isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700">جاري تحميل معلومات الماكينة...</span>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
