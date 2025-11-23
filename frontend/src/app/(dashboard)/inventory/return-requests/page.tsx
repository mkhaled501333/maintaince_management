'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { sparePartsRequestsApi } from '@/lib/api/spare-parts-requests';
import { SparePartsRequest } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';
import { formatDateArabic } from '@/lib/locale';

export default function ReturnRequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Fetch return requests (isRequestedReturn === true and isReturned === false)
  const { data, isLoading, error } = useQuery({
    queryKey: ['return-requests'],
    queryFn: () => sparePartsRequestsApi.getRequests({
      page: 1,
      pageSize: 100,
      isRequestedReturn: true,
      isReturned: false,
    }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Process return mutation
  const processReturnMutation = useMutation({
    mutationFn: (requestId: number) => sparePartsRequestsApi.processReturn(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests'] });
      setProcessingId(null);
    },
    onError: () => {
      setProcessingId(null);
    },
  });

  const handleProcessReturn = async (request: SparePartsRequest) => {
    if (confirm(`هل أنت متأكد من معالجة إرجاع ${request.quantityRequested} قطعة من ${request.sparePartNumber}؟`)) {
      setProcessingId(request.id);
      try {
        await processReturnMutation.mutateAsync(request.id);
        alert('تم معالجة الإرجاع بنجاح');
      } catch (error) {
        alert('فشل معالجة الإرجاع. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const requests = data?.requests || [];

  return (
    <ProtectedRoute requiredRoles={[UserRole.INVENTORY_MANAGER, UserRole.ADMIN]}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors touch-manipulation shadow-sm border border-gray-200"
              aria-label="رجوع"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white md:text-gray-900">طلبات الإرجاع</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            معالجة طلبات إرجاع قطع الغيار وإعادتها إلى المخزون
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">حدث خطأ أثناء تحميل طلبات الإرجاع. يرجى المحاولة مرة أخرى.</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {requests.length === 0 ? (
              <div className="p-8 text-center text-gray-500 rounded-lg border border-dashed border-gray-200">
                لا توجد طلبات إرجاع في انتظار المعالجة حالياً.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          رقم الطلب
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          تفاصيل القطعة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الكمية
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          طلب بواسطة
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          تاريخ الطلب
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{request.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {request.sparePartNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.sparePartName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.quantityRequested}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.requestedByName || `المستخدم رقم ${request.requestedBy}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateArabic(request.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleProcessReturn(request)}
                              disabled={processingId === request.id || processReturnMutation.isPending}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-700 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingId === request.id || processReturnMutation.isPending
                                ? 'جاري المعالجة...'
                                : 'معالجة الإرجاع'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

