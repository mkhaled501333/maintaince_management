'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sparePartsRequestsApi } from '../../lib/api/spare-parts-requests';
import { SparePartsRequest } from '../../lib/types';

interface PartsIssuanceProps {
  request: SparePartsRequest;
  onComplete?: () => void;
}

export function PartsIssuance({ request, onComplete }: PartsIssuanceProps) {
  const queryClient = useQueryClient();

  const issueMutation = useMutation({
    mutationFn: () => sparePartsRequestsApi.issueRequest(request.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests-approved'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests-approved', 'APPROVED'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests-approved', 'ISSUED'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-work'] });
      if (onComplete) onComplete();
    },
  });

  const handleIssue = async () => {
    if (!confirm(`هل تريد صرف ${request.quantityRequested} من ${request.sparePartNumber}؟`)) {
      return;
    }
    await issueMutation.mutateAsync();
  };

  if (request.status !== 'APPROVED') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">
          لا يمكن صرف هذا الطلب. الحالة الحالية: {request.status}. يمكن صرف الطلبات المعتمدة فقط.
        </p>
      </div>
    );
  }

  const insufficientStock = request.currentStock !== undefined && request.currentStock < request.quantityRequested;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">صرف قطع الغيار</h3>

      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-700">القطعة</p>
          <p className="text-gray-900">{request.sparePartNumber} - {request.sparePartName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">الكمية المطلوب صرفها</p>
          <p className="text-gray-900">{request.quantityRequested}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">المخزون الحالي</p>
          <p className={insufficientStock ? 'text-red-600 font-semibold' : 'text-gray-900'}>
            {request.currentStock !== undefined ? request.currentStock : 'N/A'}
            {insufficientStock && ' (Insufficient Stock!)'}
          </p>
        </div>
        {request.approvalNotes && (
          <div>
          <p className="text-sm font-medium text-gray-700">ملاحظات الاعتماد</p>
            <p className="text-gray-600">{request.approvalNotes}</p>
          </div>
        )}
      </div>

      {insufficientStock && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 font-semibold">
            ⚠ مخزون غير كافٍ: لا يمكن صرف {request.quantityRequested} وحدة. المتوفر فقط {request.currentStock}.
          </p>
        </div>
      )}

      <button
        onClick={handleIssue}
        disabled={issueMutation.isPending || insufficientStock}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {issueMutation.isPending ? 'جاري الصرف...' : 'صرف القطع'}
      </button>

      {issueMutation.isError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">
            فشل في صرف القطع. {(issueMutation.error as any)?.response?.data?.detail || 'يرجى المحاولة مرة أخرى.'}
          </p>
        </div>
      )}
    </div>
  );
}

