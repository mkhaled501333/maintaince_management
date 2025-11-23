/**
 * Custom hook that encapsulates all spare parts requests business logic:
 * fetching paginated data, approving requests, and loading related detail records.
 */
'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Machine,
  MaintenanceRequest,
  MaintenanceWork,
  SparePartsRequest,
  SparePartsRequestFilters,
  SparePartsRequestStatus,
} from '@/lib/types';
import { machineApi } from '@/lib/api/machines';
import { maintenanceRequestApi } from '@/lib/api/maintenance-requests';
import { maintenanceWorkApi } from '@/lib/api/maintenance-work';
import { sparePartsRequestsApi } from '@/lib/api/spare-parts-requests';

export interface SparePartsRequestDetail {
  spareRequest: SparePartsRequest;
  maintenanceRequest: MaintenanceRequest | null;
  maintenanceWork: MaintenanceWork | null;
  machine: Machine | null;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

export function useSparePartsRequests() {
  const [filters, setFilters] = useState<SparePartsRequestFilters>({
    page: 1,
    pageSize: 25,
    status: 'PENDING' as SparePartsRequestStatus,
  });
  const [detailData, setDetailData] = useState<SparePartsRequestDetail | null>(null);
  const [detailRequestId, setDetailRequestId] = useState<number | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['maintenance', 'spare-parts-requests', filters],
    queryFn: () => sparePartsRequestsApi.getRequests(filters),
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, approvalNotes }: { requestId: number; approvalNotes?: string }) =>
      sparePartsRequestsApi.approveRequest(
        requestId,
        approvalNotes ? { approvalNotes } : {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'spare-parts-requests'] });
      queryClient.invalidateQueries({ queryKey: ['home-dashboard', 'pending-spare-parts-requests'] });
    },
  });

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleApproveRequest = useCallback(
    async (request: SparePartsRequest) => {
      const confirmed = window.confirm('هل ترغب في اعتماد طلب قطع الغيار هذا؟');
      if (!confirmed) return;

      setFeedback(null);
      setApprovingId(request.id);

      try {
        await approveMutation.mutateAsync({ requestId: request.id });
        setFeedback({
          type: 'success',
          message: `تم اعتماد الطلب رقم ${request.id} بنجاح.`,
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.detail ||
          error?.message ||
          'حدث خطأ غير متوقع أثناء اعتماد الطلب.';
        setFeedback({ type: 'error', message });
      } finally {
        setApprovingId(null);
      }
    },
    [approveMutation]
  );

  const handleShowDetails = useCallback(
    async (request: SparePartsRequest) => {
      setFeedback(null);
      setIsDetailLoading(true);
      setDetailRequestId(request.id);

      try {
        const maintenanceWork = await queryClient.fetchQuery({
          queryKey: ['maintenance-work', request.maintenanceWorkId],
          queryFn: () => maintenanceWorkApi.getWork(request.maintenanceWorkId),
        });

        const maintenanceRequest =
          maintenanceWork?.requestId != null
            ? await queryClient.fetchQuery({
                queryKey: ['maintenance-request', maintenanceWork.requestId],
                queryFn: () => maintenanceRequestApi.getRequest(maintenanceWork.requestId),
              })
            : null;

        const machine =
          maintenanceRequest?.machineId != null
            ? await queryClient.fetchQuery({
                queryKey: ['machine', maintenanceRequest.machineId],
                queryFn: () => machineApi.getMachine(maintenanceRequest.machineId),
              })
            : null;

        setDetailData({
          spareRequest: request,
          maintenanceRequest,
          maintenanceWork,
          machine,
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.detail ||
          error?.message ||
          'تعذر تحميل تفاصيل بلاغ الصيانة.';
        setFeedback({ type: 'error', message });
        setDetailData(null);
        setDetailRequestId(null);
      } finally {
        setIsDetailLoading(false);
      }
    },
    [queryClient]
  );

  const closeDetail = useCallback(() => {
    setDetailData(null);
    setDetailRequestId(null);
  }, []);

  return {
    approvingId,
    detailData,
    detailRequestId,
    feedback,
    filters,
    handleApproveRequest,
    handlePageChange,
    handleShowDetails,
    isDetailLoading,
    isError,
    isLoading,
    requests: data?.requests ?? [],
    totalPages: data?.totalPages ?? 1,
    closeDetail,
  };
}

