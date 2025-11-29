'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sparePartsRequestsApi } from '../../lib/api/spare-parts-requests';
import { SparePartsRequest, SparePartsRequestStatus, SparePartsRequestFilters, UserRole } from '../../lib/types';
import { sparePartsRequestStatusLabels, formatDateArabic, RETURN_REQUESTED_BADGE, RETURNED_BADGE } from '../../lib/locale';
import { SparePartsRequestForm } from './SparePartsRequestForm';
import { useAuth } from '../../lib/auth';

interface SparePartsRequestsListProps {
  maintenanceWorkId?: number;
  onRequestClick?: (request: SparePartsRequest) => void;
  onCreateNew?: () => void;
}

function getStatusColor(status: SparePartsRequestStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'ISSUED':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function SparePartsRequestsList({ maintenanceWorkId, onRequestClick, onCreateNew }: SparePartsRequestsListProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<SparePartsRequestFilters>({
    page: 1,
    pageSize: 25,
    maintenanceWorkId,
  });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const queryClient = useQueryClient();
  
  // Check if user can create spare parts requests (technicians and managers)
  const canCreateRequest = user?.role === UserRole.MAINTENANCE_TECH || 
                          user?.role === UserRole.MAINTENANCE_MANAGER || 
                          user?.role === UserRole.ADMIN;

  // Fetch requests with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['spare-parts-requests', filters],
    queryFn: () => sparePartsRequestsApi.getRequests(filters),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Return request mutation
  const returnRequestMutation = useMutation({
    mutationFn: (requestId: number) => sparePartsRequestsApi.requestReturn(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests'] });
    },
  });

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleRequestReturn = async (e: React.MouseEvent, requestId: number) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من طلب إرجاع هذه القطع؟')) {
      try {
        await returnRequestMutation.mutateAsync(requestId);
        alert('تم طلب الإرجاع بنجاح');
      } catch (error) {
        alert('فشل طلب الإرجاع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32 py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-2">
        <p className="text-xs text-red-800">فشل تحميل طلبات قطع الغيار. يرجى المحاولة مرة أخرى.</p>
      </div>
    );
  }

  const requests = data?.requests || [];

  const handleSave = () => {
    setShowRequestForm(false);
    queryClient.invalidateQueries({ queryKey: ['spare-parts-requests'] });
    onCreateNew?.();
  };

  const handleCancel = () => {
    setShowRequestForm(false);
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Header with Add Button */}
      {maintenanceWorkId && (
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-semibold text-gray-900">طلبات قطع الغيار</h4>
          {canCreateRequest && !showRequestForm && (
            <button
              onClick={() => setShowRequestForm(true)}
              className="bg-blue-600 text-white border-none rounded px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-blue-700 inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              إضافة قطعة غيار
            </button>
          )}
        </div>
      )}

      {/* Request Form */}
      {showRequestForm && maintenanceWorkId && (
        <div className="mb-4">
          <SparePartsRequestForm
            maintenanceWorkId={maintenanceWorkId}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Requests List - Enhanced Card Layout */}
      {requests.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm font-medium text-gray-600">لا توجد طلبات لقطع الغيار</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => onRequestClick?.(request)}
                className={`border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 hover:shadow-md transition-all ${
                  onRequestClick ? 'cursor-pointer' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-sm font-bold text-gray-900">
                          {request.sparePartNumber}
                        </span>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(request.status)}`}>
                        {sparePartsRequestStatusLabels[request.status]}
                      </span>
                      {request.isRequestedReturn && !request.isReturned && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-orange-100 text-orange-600 border-orange-200">
                          {RETURN_REQUESTED_BADGE}
                        </span>
                      )}
                      {request.isReturned && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                          {RETURNED_BADGE}
                        </span>
                      )}
                    </div>
                    {request.sparePartName && (
                      <div className="text-sm text-gray-600 mb-2">{request.sparePartName}</div>
                    )}
                    <div className="flex items-center gap-4 flex-wrap text-sm">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span className="text-gray-600">الكمية:</span>
                        <span className="font-semibold text-gray-900">{request.quantityRequested}</span>
                      </div>
                      {request.currentStock !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <span className="text-gray-600">المخزون:</span>
                          <span className="font-semibold text-gray-900">{request.currentStock}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">{formatDateArabic(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 sm:text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 sm:justify-end mb-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium text-gray-900">
                        {request.requestedByName || `المستخدم رقم ${request.requestedBy}`}
                      </span>
                    </div>
                    {request.approvedByName && (
                      <div className="text-xs text-gray-500 mt-1">
                        اعتمد بواسطة: {request.approvedByName}
                      </div>
                    )}
                    {request.status === 'ISSUED' && !request.isRequestedReturn && !request.isReturned && (
                      <button
                        onClick={(e) => handleRequestReturn(e, request.id)}
                        disabled={returnRequestMutation.isPending}
                        className="mt-2 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {returnRequestMutation.isPending ? 'جاري المعالجة...' : 'طلب إرجاع'}
                      </button>
                    )}
                    {request.isRequestedReturn && !request.isReturned && (
                      <div className="text-xs text-orange-600 mt-2">
                        في انتظار معالجة الإرجاع
                      </div>
                    )}
                    {request.isReturned && request.returnDate && (
                      <div className="text-xs text-gray-500 mt-2">
                        تم الإرجاع في: {formatDateArabic(request.returnDate)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination - Enhanced */}
          {data && data.totalPages > 1 && (
            <div className="pt-4 mt-4 border-t-2 border-gray-300 flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-gray-700">
                صفحة <span className="font-bold text-gray-900">{filters.page || 1}</span> من <span className="font-bold text-gray-900">{data.totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                  className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  السابق
                </button>
                <button
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={(filters.page || 1) >= data.totalPages}
                  className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

