'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sparePartsRequestsApi } from '../../lib/api/spare-parts-requests';
import { SparePartsRequest, ApproveRequest, RejectRequest } from '../../lib/types';

interface RequestApprovalProps {
  request: SparePartsRequest;
  onComplete?: () => void;
}

export function RequestApproval({ request, onComplete }: RequestApprovalProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (data: ApproveRequest) => sparePartsRequestsApi.approveRequest(request.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-work'] });
      if (onComplete) onComplete();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: RejectRequest) => sparePartsRequestsApi.rejectRequest(request.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-work'] });
      if (onComplete) onComplete();
    },
  });

  const handleApprove = async () => {
    if (action !== 'approve') {
      setAction('approve');
      return;
    }
    await approveMutation.mutateAsync({ approvalNotes: approvalNotes || undefined });
  };

  const handleReject = async () => {
    if (action !== 'reject') {
      setAction('reject');
      return;
    }
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    await rejectMutation.mutateAsync({ rejectionReason });
  };

  if (request.status !== 'PENDING') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">This request cannot be approved or rejected. Current status: {request.status}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve/Reject Request</h3>

      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm font-medium text-gray-700">Part</p>
          <p className="text-gray-900">{request.sparePartNumber} - {request.sparePartName}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Quantity Requested</p>
          <p className="text-gray-900">{request.quantityRequested}</p>
        </div>
        {request.currentStock !== undefined && (
          <div>
            <p className="text-sm font-medium text-gray-700">Current Stock</p>
            <p className={request.currentStock < request.quantityRequested ? 'text-red-600' : 'text-gray-900'}>
              {request.currentStock} {request.currentStock < request.quantityRequested && '(Insufficient)'}
            </p>
          </div>
        )}
      </div>

      {action === null && (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      )}

      {action === 'approve' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approval Notes (Optional)</label>
            <textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
              placeholder="Add any notes about this approval..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
            </button>
            <button
              onClick={() => setAction(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {action === 'reject' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              placeholder="Please explain why this request is being rejected..."
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setAction(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

