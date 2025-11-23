/**
 * Presentation component responsible for rendering the spare parts requests table and pagination controls.
 */
'use client';

import { formatDateArabic, sparePartsRequestStatusLabels } from '@/lib/locale';
import { SparePartsRequest, SparePartsRequestFilters } from '@/lib/types';

interface SparePartsRequestsTableProps {
  requests: SparePartsRequest[];
  filters: SparePartsRequestFilters;
  totalPages: number;
  isLoading: boolean;
  isError: boolean;
  approvingId: number | null;
  detailRequestId: number | null;
  isDetailLoading: boolean;
  onPageChange: (page: number) => void;
  onApprove: (request: SparePartsRequest) => void;
  onOpenDetails: (request: SparePartsRequest) => void;
}

export function SparePartsRequestsTable({
  approvingId,
  detailRequestId,
  filters,
  isDetailLoading,
  isError,
  isLoading,
  onApprove,
  onOpenDetails,
  onPageChange,
  requests,
  totalPages,
}: SparePartsRequestsTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <div className="overflow-x-auto">
        <div className="max-h-[65vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'رقم الطلب',
                  'رقم قطعة الغيار',
                  'اسم قطعة الغيار',
                  'الكمية المطلوبة',
                  'المخزون الحالي',
                  'الحالة',
                  'طلب الصيانة',
                  'أنشئ بواسطة',
                  'اعتمد بواسطة',
                  'تاريخ الإنشاء',
                  'آخر تحديث',
                  'الإجراءات',
                ].map((title) => (
                  <th
                    key={title}
                    scope="col"
                    className="sticky top-0 z-10 whitespace-nowrap bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {renderTableBody({
                approvingId,
                detailRequestId,
                isDetailLoading,
                isError,
                isLoading,
                onApprove,
                onOpenDetails,
                requests,
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <footer className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span>
            صفحة <span className="font-semibold text-gray-900">{filters.page ?? 1}</span> من{' '}
            <span className="font-semibold text-gray-900">{totalPages}</span>
          </span>

          <nav className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max((filters.page ?? 1) - 1, 1))}
              disabled={(filters.page ?? 1) === 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              السابق
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min((filters.page ?? 1) + 1, totalPages))}
              disabled={(filters.page ?? 1) >= totalPages}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              التالي
            </button>
          </nav>
        </footer>
      )}
    </section>
  );
}

interface RenderTableBodyArgs {
  isLoading: boolean;
  isError: boolean;
  requests: SparePartsRequest[];
  approvingId: number | null;
  detailRequestId: number | null;
  isDetailLoading: boolean;
  onApprove: (request: SparePartsRequest) => void;
  onOpenDetails: (request: SparePartsRequest) => void;
}

function renderTableBody({
  approvingId,
  detailRequestId,
  isDetailLoading,
  isError,
  isLoading,
  onApprove,
  onOpenDetails,
  requests,
}: RenderTableBodyArgs) {
  if (isLoading) {
    return (
      <tr>
        <td colSpan={12} className="px-4 py-10">
          <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>جاري تحميل البيانات...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (isError) {
    return (
      <tr>
        <td colSpan={12} className="px-4 py-6">
          <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            تعذر تحميل بيانات طلبات قطع الغيار. يرجى المحاولة مرة أخرى لاحقاً.
          </div>
        </td>
      </tr>
    );
  }

  if (requests.length === 0) {
    return (
      <tr>
        <td colSpan={12} className="px-4 py-6 text-center text-sm text-gray-500">
          لا توجد طلبات قطع غيار معلقة حالياً.
        </td>
      </tr>
    );
  }

  return (
    <>
      {requests.map((request) => (
        <tr key={request.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm font-medium text-gray-900">#{request.id}</td>
          <td className="px-4 py-3 text-sm text-gray-700">{request.sparePartNumber || '-'}</td>
          <td className="px-4 py-3 text-sm text-gray-700">{request.sparePartName || '-'}</td>
          <td className="px-4 py-3 text-sm text-gray-700">{request.quantityRequested}</td>
          <td className="px-4 py-3 text-sm text-gray-700">
            {request.currentStock !== undefined ? request.currentStock : '-'}
          </td>
          <td className="px-4 py-3 text-sm">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {sparePartsRequestStatusLabels[request.status]}
            </span>
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">#{request.maintenanceWorkId}</td>
          <td className="px-4 py-3 text-sm text-gray-700">
            {request.requestedByName || `المستخدم رقم ${request.requestedBy}`}
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">
            {request.approvedByName || (request.approvedBy ? `المستخدم رقم ${request.approvedBy}` : '-')}
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">{formatDateArabic(request.createdAt)}</td>
          <td className="px-4 py-3 text-sm text-gray-700">{formatDateArabic(request.updatedAt)}</td>
          <td className="px-4 py-3 text-sm text-gray-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => onApprove(request)}
                disabled={approvingId === request.id}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {approvingId === request.id ? 'جارٍ الاعتماد...' : 'اعتماد الطلب'}
              </button>
              <button
                type="button"
                onClick={() => onOpenDetails(request)}
                disabled={isDetailLoading && detailRequestId === request.id}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDetailLoading && detailRequestId === request.id ? 'جاري التحميل...' : 'تفاصيل البلاغ'}
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

