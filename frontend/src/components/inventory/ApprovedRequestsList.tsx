'use client';

import { useState } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { sparePartsRequestsApi } from '@/lib/api/spare-parts-requests';
import { PartsIssuance } from '@/components/maintenance/PartsIssuance';
import { SparePartsRequest, SparePartsRequestStatus } from '@/lib/types';
import { RETURN_REQUESTED_BADGE, RETURNED_BADGE, formatDateArabic } from '@/lib/locale';

interface ApprovedRequestsListProps {
  onRequestSelect: (request: SparePartsRequest) => void;
  selectedRequest: SparePartsRequest | null;
  onComplete: () => void;
}

const statusOptions = [
  {
    value: 'APPROVED',
    label: 'طلبات بانتظار الصرف',
    activeClass: 'bg-blue-600 text-white',
  },
  {
    value: 'PENDING',
    label: 'طلبات قيد الاعتماد',
    activeClass: 'bg-yellow-600 text-white',
  },
  {
    value: 'REJECTED',
    label: 'طلبات مرفوضة',
    activeClass: 'bg-red-600 text-white',
  },
  {
    value: 'ISSUED',
    label: 'طلبات تم صرفها',
    activeClass: 'bg-green-600 text-white',
  },
  {
    value: 'RETURN_REQUESTS',
    label: 'طلبات الإرجاع',
    activeClass: 'bg-orange-600 text-white',
  },
] as const;

type StatusFilter = (typeof statusOptions)[number]['value'];

const statusLabels: Record<SparePartsRequestStatus, string> = {
  APPROVED: 'معتمد',
  PENDING: 'قيد الاعتماد',
  REJECTED: 'مرفوض',
  ISSUED: 'تم الصرف',
};

const statusColors: Record<SparePartsRequestStatus, string> = {
  APPROVED: 'text-blue-600',
  PENDING: 'text-yellow-600',
  REJECTED: 'text-red-600',
  ISSUED: 'text-green-600',
};

const emptyMessages: Record<StatusFilter, string> = {
  APPROVED: 'لا توجد طلبات معتمدة بانتظار الصرف.',
  PENDING: 'لا توجد طلبات قيد الاعتماد حالياً.',
  REJECTED: 'لا توجد طلبات مرفوضة.',
  ISSUED: 'لا توجد طلبات تم صرفها مؤخراً.',
  RETURN_REQUESTS: 'لا توجد طلبات إرجاع في انتظار المعالجة حالياً.',
};

export function ApprovedRequestsList({ onRequestSelect, selectedRequest, onComplete }: ApprovedRequestsListProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('APPROVED');
  const queryClient = useQueryClient();
  const [processingReturnId, setProcessingReturnId] = useState<number | null>(null);

  // Query for return requests
  const returnRequestsQuery = useQuery({
    queryKey: ['return-requests'],
    queryFn: () =>
      sparePartsRequestsApi.getRequests({
        page: 1,
        pageSize: 100,
        isRequestedReturn: true,
        isReturned: false,
      }),
  });

  const statusQueries = useQueries({
    queries: statusOptions
      .filter((option) => option.value !== 'RETURN_REQUESTS')
      .map((option) => ({
        queryKey: ['spare-parts-requests-approved', option.value],
        queryFn: () =>
          sparePartsRequestsApi.getRequests({
            page: 1,
            pageSize: 100,
            status: option.value,
          }),
      })),
  });

  // Map status options to their query indices (excluding RETURN_REQUESTS)
  const statusOptionsWithoutReturn = statusOptions.filter((o) => o.value !== 'RETURN_REQUESTS');
  const statusIndex = statusOptionsWithoutReturn.findIndex((option) => option.value === statusFilter);
  
  const activeQuery = statusFilter === 'RETURN_REQUESTS' 
    ? returnRequestsQuery 
    : statusQueries[statusIndex >= 0 ? statusIndex : 0];

  const counts = statusOptions.reduce<Record<StatusFilter, number>>((acc, option) => {
    if (option.value === 'RETURN_REQUESTS') {
      acc[option.value] = returnRequestsQuery?.data?.total ?? returnRequestsQuery?.data?.requests?.length ?? 0;
    } else {
      const queryIndex = statusOptionsWithoutReturn.findIndex((o) => o.value === option.value);
      const data = statusQueries[queryIndex]?.data;
      acc[option.value] = data?.total ?? data?.requests?.length ?? 0;
    }
    return acc;
  }, {} as Record<StatusFilter, number>);

  const requests = activeQuery?.data?.requests || [];

  // Process return mutation
  const processReturnMutation = useMutation({
    mutationFn: (requestId: number) => sparePartsRequestsApi.processReturn(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests-approved'] });
      setProcessingReturnId(null);
    },
    onError: () => {
      setProcessingReturnId(null);
    },
  });

  const handleStatusFilter = (status: StatusFilter) => {
    setStatusFilter(status);
  };

  const handleProcessReturn = async (request: SparePartsRequest) => {
    if (confirm(`هل أنت متأكد من معالجة إرجاع ${request.quantityRequested} قطعة من ${request.sparePartNumber}؟`)) {
      setProcessingReturnId(request.id);
      try {
        await processReturnMutation.mutateAsync(request.id);
        alert('تم معالجة الإرجاع بنجاح');
      } catch (error) {
        alert('فشل معالجة الإرجاع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  // Show loading state
  const isLoading = statusFilter === 'RETURN_REQUESTS' 
    ? returnRequestsQuery?.isLoading 
    : activeQuery?.isLoading;

  const isError = statusFilter === 'RETURN_REQUESTS'
    ? returnRequestsQuery?.isError
    : activeQuery?.isError;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">حدث خطأ أثناء تحميل الطلبات. يرجى المحاولة مرة أخرى.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Status Filter */}
      <div className="flex flex-wrap gap-3">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleStatusFilter(option.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === option.value
                ? option.activeClass
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label} ({counts[option.value] ?? 0})
          </button>
        ))}
      </div>

      {/* Requests Table */}
      {requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500 rounded-lg border border-dashed border-gray-200">
          {emptyMessages[statusFilter]}
        </div>
      ) : (
        <div className="flex-1">
          <div className="hidden md:block h-full">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        رقم البلاغ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تفاصيل القطعة
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الكمية المطلوبة
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        المخزون الحالي
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تم الطلب بواسطة
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تم الاعتماد بواسطة
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        تاريخ الاعتماد
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className={`hover:bg-gray-50 ${
                          selectedRequest?.id === request.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          رقم {request.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.sparePartNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.sparePartName}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {request.isRequestedReturn && !request.isReturned && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-600">
                                {RETURN_REQUESTED_BADGE}
                              </span>
                            )}
                            {request.isReturned && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                {RETURNED_BADGE}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.quantityRequested}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.currentStock !== undefined && request.currentStock < request.quantityRequested
                                ? 'bg-red-100 text-red-800'
                                : request.currentStock !== undefined && request.currentStock < request.quantityRequested * 2
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {request.currentStock !== undefined ? request.currentStock : 'غير متوفر'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.requestedByName || `المستخدم رقم ${request.requestedBy}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.approvedByName || 'غير متوفر'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'غير متوفر'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {statusFilter === 'RETURN_REQUESTS' ? (
                            <button
                              onClick={() => handleProcessReturn(request)}
                              disabled={processingReturnId === request.id || processReturnMutation.isPending}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-700 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingReturnId === request.id || processReturnMutation.isPending
                                ? 'جاري المعالجة...'
                                : 'معالجة الإرجاع'}
                            </button>
                          ) : request.status === 'APPROVED' ? (
                            <button
                              onClick={() => onRequestSelect(request)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              صرف القطع
                            </button>
                          ) : (
                            <span className={`${statusColors[request.status]} text-sm font-semibold`}>
                              {statusLabels[request.status]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="md:hidden space-y-4 max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 p-2">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`bg-white rounded-lg shadow-sm p-4 border ${
                  selectedRequest?.id === request.id ? 'border-blue-400' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">
                    رقم {request.id}
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.currentStock !== undefined && request.currentStock < request.quantityRequested
                        ? 'bg-red-100 text-red-800'
                        : request.currentStock !== undefined && request.currentStock < request.quantityRequested * 2
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {request.currentStock !== undefined ? request.currentStock : 'غير متوفر'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    <p className="font-medium text-gray-900">{request.sparePartNumber}</p>
                    <p className="text-gray-500">{request.sparePartName}</p>
                    <div className="flex gap-2 mt-1">
                      {request.isRequestedReturn && !request.isReturned && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-600">
                          {RETURN_REQUESTED_BADGE}
                        </span>
                      )}
                      {request.isReturned && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          {RETURNED_BADGE}
                        </span>
                      )}
                    </div>
                    {request.isReturned && request.returnDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        تم الإرجاع في: {formatDateArabic(request.returnDate)}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span>الكمية المطلوبة:</span>
                    <span className="font-medium text-gray-900">{request.quantityRequested}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تم الطلب بواسطة:</span>
                    <span className="font-medium text-gray-900">
                      {request.requestedByName || `المستخدم رقم ${request.requestedBy}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>تم الاعتماد بواسطة:</span>
                    <span className="font-medium text-gray-900">
                      {request.approvedByName || 'غير متوفر'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>تاريخ الاعتماد:</span>
                    <span className="font-medium text-gray-900">
                      {request.approvedAt ? new Date(request.approvedAt).toLocaleDateString() : 'غير متوفر'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {statusFilter === 'RETURN_REQUESTS' ? (
                    <button
                      onClick={() => handleProcessReturn(request)}
                      disabled={processingReturnId === request.id || processReturnMutation.isPending}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-700 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processingReturnId === request.id || processReturnMutation.isPending
                        ? 'جاري المعالجة...'
                        : 'معالجة الإرجاع'}
                    </button>
                  ) : request.status === 'APPROVED' ? (
                    <button
                      onClick={() => onRequestSelect(request)}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                    >
                      صرف القطع
                    </button>
                  ) : (
                    <span className={`${statusColors[request.status]} text-sm font-semibold`}>
                      {statusLabels[request.status]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parts Issuance Modal */}
      {selectedRequest && selectedRequest.status === 'APPROVED' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  صرف قطع الغيار
                </h3>
                <button
                  onClick={onComplete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <PartsIssuance 
                request={selectedRequest} 
                onComplete={onComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
