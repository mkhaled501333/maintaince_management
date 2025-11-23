'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceRequestApi } from '../../lib/api/maintenance-requests';
import { MaintenanceRequest, MaintenanceRequestFilters, RequestStatus, UserRole } from '../../lib/types';
import {
  maintenanceRequestStatusLabels,
  formatDateArabic,
} from '../../lib/locale';
import { useAuth } from '../../lib/auth';

interface TechnicianDashboardProps {
  onRequestSelect: (request: MaintenanceRequest) => void;
}

type TabType = 'available' | 'my-work';

export function TechnicianDashboard({ onRequestSelect }: TechnicianDashboardProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [availableFilters, setAvailableFilters] = useState<MaintenanceRequestFilters>({
    page: 1,
    limit: 25,
  });
  const [myWorkFilters, setMyWorkFilters] = useState<MaintenanceRequestFilters>({
    page: 1,
    limit: 25,
  });
  const queryClient = useQueryClient();
  
  // Determine tab label based on user role
  const isManagerOrAdmin = user?.role === UserRole.MAINTENANCE_MANAGER || user?.role === UserRole.ADMIN;
  const myWorkTabLabel = isManagerOrAdmin ? 'الأعمال' : 'عملي';

  // Fetch available requests (PENDING, no MaintenanceWork) - Always enabled
  const { data: availableData, isLoading: isLoadingAvailable, error: availableError } = useQuery({
    queryKey: ['available-requests', availableFilters],
    queryFn: () => maintenanceRequestApi.getAvailableRequests({ ...availableFilters, status: RequestStatus.PENDING }),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    enabled: true, // Always fetch to show badge counts
  });

  // Fetch my work requests (IN_PROGRESS and WAITING_PARTS with technician's MaintenanceWork) - Always enabled
  const { data: myWorkData, isLoading: isLoadingMyWork, error: myWorkError } = useQuery({
    queryKey: ['my-work-requests', myWorkFilters],
    queryFn: () => maintenanceRequestApi.getMyWorkRequests({ ...myWorkFilters }), // Remove status filter to get all assigned work
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    enabled: true, // Always fetch to show badge counts
  });

  // Accept request mutation
  const acceptMutation = useMutation({
    mutationFn: (requestId: number) => maintenanceRequestApi.acceptRequest(requestId),
    onSuccess: () => {
      // Invalidate and refetch both queries
      queryClient.invalidateQueries({ queryKey: ['available-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-work-requests'] });
    },
  });

  // Reset page to 1 when switching tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'available') {
      setAvailableFilters({ ...availableFilters, page: 1 });
    } else {
      setMyWorkFilters({ ...myWorkFilters, page: 1 });
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    if (confirm('هل أنت متأكد من قبول هذا الطلب؟')) {
      try {
        await acceptMutation.mutateAsync(requestId);
        // Switch to my-work tab after acceptance
        handleTabChange('my-work');
      } catch (error) {
        console.error('Failed to accept request:', error);
        alert('فشل قبول الطلب. ربما تم قبوله من قبل فني آخر.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    if (activeTab === 'available') {
      setAvailableFilters({ ...availableFilters, page });
    } else {
      setMyWorkFilters({ ...myWorkFilters, page });
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case RequestStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case RequestStatus.WAITING_PARTS:
        return 'bg-purple-100 text-purple-800';
      case RequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case RequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const currentData = activeTab === 'available' ? availableData : myWorkData;
  const isLoading = activeTab === 'available' ? isLoadingAvailable : isLoadingMyWork;
  const error = activeTab === 'available' ? availableError : myWorkError;
  const currentFilters = activeTab === 'available' ? availableFilters : myWorkFilters;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs - Sticky */}
      <div className="sticky top-[64px] sm:top-[72px] bg-white border-b border-gray-200 z-20 shadow-sm">
        <nav className="flex -mb-px">
          <button
            onClick={() => handleTabChange('available')}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium text-xs sm:text-sm relative ${
              activeTab === 'available'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="hidden sm:inline">الأعطال الحالية</span>
            <span className="sm:hidden">الأعطال الحالية</span>
            {availableData !== undefined && (
              <span className={`ml-1.5 sm:ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 sm:px-2 text-xs font-semibold rounded-full ${
                availableData.total > 0 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {availableData.total}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('my-work')}
            className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium text-xs sm:text-sm relative ${
              activeTab === 'my-work'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {myWorkTabLabel}
            {myWorkData !== undefined && (
              <span className={`ml-1.5 sm:ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 sm:px-2 text-xs font-semibold rounded-full ${
                myWorkData.total > 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {myWorkData.total}
              </span>
            )}
          </button>
        </nav>
      </div>


      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                خطأ في تحميل الطلبات
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error instanceof Error ? error.message : 'حدث خطأ'}
              </div>
            </div>
          </div>
        </div>
      ) : !currentData || currentData.requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {activeTab === 'available' 
              ? 'لا توجد طلبات متاحة في الوقت الحالي.' 
              : 'ليس لديك أي مهام عمل نشطة.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">
                        رقم البلاغ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">
                        الطلب
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">
                        الماكينة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">
                        الحالة
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">
                        تاريخ الإبلاغ
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-300">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.requests.map((request, index) => (
                      <tr key={request.id} className={`hover:bg-blue-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">
                            {request.id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 max-w-xs truncate">
                            {request.title || request.description.substring(0, 60)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ماكينة {request.machineId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {maintenanceRequestStatusLabels[request.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {formatDateArabic(request.requestedDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            {activeTab === 'available' && (
                              <button
                                onClick={() => handleAcceptRequest(request.id)}
                                disabled={acceptMutation.isPending}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {acceptMutation.isPending ? 'جاري القبول...' : 'قبول'}
                              </button>
                            )}
                            <button
                              onClick={() => onRequestSelect(request)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                            >
                              عرض التفاصيل
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-3 sm:p-4">
            {currentData.requests.map((request) => (
              <div key={request.id} className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-md hover:shadow-lg hover:border-blue-300 transition-all">
                {/* Header with Title */}
                <div className="mb-3">
                  {(request.title || request.description) && (
                    <div className="text-sm text-gray-700 line-clamp-2">
                      {request.title || request.description}
                    </div>
                  )}
                </div>
                
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">رقم البلاغ</span>
                    <p className="text-sm font-semibold text-gray-900">{request.id}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">رقم الماكينة</span>
                    <p className="text-sm font-semibold text-gray-900">{request.machineId}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">تاريخ الإبلاغ</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateArabic(request.requestedDate)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">الحالة:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {maintenanceRequestStatusLabels[request.status]}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-row gap-2 mt-4 pt-3 border-t border-gray-200">
                  {activeTab === 'available' && (
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={acceptMutation.isPending}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {acceptMutation.isPending ? 'جاري القبول...' : 'قبول العمل'}
                    </button>
                  )}
                  <button
                    onClick={() => onRequestSelect(request)}
                    className={`px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 touch-manipulation ${activeTab === 'available' ? 'flex-1' : 'w-full'}`}
                  >
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {currentData && currentData.totalPages > 1 && (
            <div className="bg-white px-3 sm:px-4 md:px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between items-center sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentFilters.page! - 1)}
                    disabled={currentFilters.page === 1}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    السابق
                  </button>
                  <div className="text-xs font-medium text-gray-700">
                    صفحة {currentFilters.page} / {currentData.totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentFilters.page! + 1)}
                    disabled={currentFilters.page === currentData.totalPages}
                    className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    التالي
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700">
                      عرض <span className="font-medium">{((currentFilters.page! - 1) * currentFilters.limit!) + 1}</span> إلى{' '}
                      <span className="font-medium">
                        {Math.min(currentFilters.page! * currentFilters.limit!, currentData.total)}
                      </span>{' '}
                      من <span className="font-medium">{currentData.total}</span> نتيجة
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentFilters.page! - 1)}
                        disabled={currentFilters.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        السابق
                      </button>
                      {Array.from({ length: currentData.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium touch-manipulation ${
                            currentFilters.page === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentFilters.page! + 1)}
                        disabled={currentFilters.page === currentData.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      >
                        التالي
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

