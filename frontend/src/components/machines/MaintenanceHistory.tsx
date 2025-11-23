'use client';

import React from 'react';
import {
  MaintenanceRequestBasicInfo,
  RequestStatus,
  RequestPriority,
} from '@/lib/types';
import {
  maintenanceRequestStatusLabels,
  maintenanceRequestPriorityLabels,
  formatDateArabic,
} from '@/lib/locale';

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
}

interface MaintenanceHistoryProps {
  history: MaintenanceRequestBasicInfo[];
  pagination: PaginationMeta;
  onLoadMore: () => void;
}

const MaintenanceHistory: React.FC<MaintenanceHistoryProps> = ({ history, pagination, onLoadMore }) => {
  const getRequestStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case RequestStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case RequestStatus.WAITING_PARTS:
        return 'bg-orange-100 text-orange-800';
      case RequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case RequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: RequestPriority) => {
    switch (priority) {
      case RequestPriority.CRITICAL:
        return 'text-red-600';
      case RequestPriority.HIGH:
        return 'text-orange-600';
      case RequestPriority.MEDIUM:
        return 'text-yellow-600';
      case RequestPriority.LOW:
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">سجل الصيانة</h2>

      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((request) => (
            <div
              key={request.id}
              className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{request.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getRequestStatusColor(
                      request.status as RequestStatus
                    )}`}
                  >
                    {maintenanceRequestStatusLabels[request.status as RequestStatus] || request.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className={`font-medium ${getPriorityColor(request.priority as RequestPriority)}`}>
                  {maintenanceRequestPriorityLabels[request.priority as RequestPriority] || request.priority} - أولوية
                </span>
                <span>
                  {formatDateArabic(request.requestedDate, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {request.actualCompletionDate && (
                  <span className="text-green-600">
                    اكتمل في:{' '}
                    {formatDateArabic(request.actualCompletionDate, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}

          {pagination.page < pagination.totalPages && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onLoadMore}
                className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                تحميل المزيد (المتبقي {pagination.totalPages - pagination.page} صفحات)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <p className="mt-2">لا يوجد سجل صيانة متاح</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceHistory;

