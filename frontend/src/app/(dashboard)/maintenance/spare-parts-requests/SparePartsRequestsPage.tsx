/**
 * High-level spare parts requests page component.
 * All business logic lives inside `useSparePartsRequests`; this component focuses on layout and composition.
 */
'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';
import { RequestDetailModal } from '@/components/maintenance/RequestDetailModal';
import { SparePartsRequestsTable } from './SparePartsRequestsTable';
import { useSparePartsRequests } from './useSparePartsRequests';

export default function SparePartsRequestsPage() {
  const {
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
    requests,
    totalPages,
    closeDetail,
  } = useSparePartsRequests();

  return (
    <ProtectedRoute requiredRoles={[UserRole.MAINTENANCE_MANAGER, UserRole.ADMIN]}>
      <div className="relative space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">طلبات قطع الغيار المعلقة</h1>
          <p className="text-sm text-gray-500">
            عرض جميع طلبات قطع الغيار المعلقة مع تفاصيل الطلب والحالة والمستخدمين المعنيين.
          </p>
        </header>

        {feedback && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <SparePartsRequestsTable
          approvingId={approvingId}
          detailRequestId={detailRequestId}
          filters={filters}
          isDetailLoading={isDetailLoading}
          isError={isError}
          isLoading={isLoading}
          onApprove={handleApproveRequest}
          onOpenDetails={handleShowDetails}
          onPageChange={handlePageChange}
          requests={requests}
          totalPages={totalPages}
        />

        {detailData?.maintenanceRequest && (
          <RequestDetailModal
            request={detailData.maintenanceRequest}
            isOpen={!!detailData}
            onClose={closeDetail}
            forceShowWorkProgress={true}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

