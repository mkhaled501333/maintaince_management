'use client';

import React from 'react';
import {
  MachineDetailResponse,
  MaintenanceRequestBasicInfo,
  MachineStatus,
  RequestStatus,
  RequestPriority,
} from '@/lib/types';
import {
  machineStatusLabels,
  maintenanceRequestStatusLabels,
  maintenanceRequestPriorityLabels,
  formatDateArabic,
} from '@/lib/locale';

interface MachineStatusPanelProps {
  machine: MachineDetailResponse;
  activeRequests: MaintenanceRequestBasicInfo[];
}

const MachineStatusPanel: React.FC<MachineStatusPanelProps> = ({ machine, activeRequests }) => {
  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL:
        return 'bg-green-500';
      case MachineStatus.DOWN:
        return 'bg-red-500';
      case MachineStatus.MAINTENANCE:
        return 'bg-yellow-500';
      case MachineStatus.DECOMMISSIONED:
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

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
        return 'bg-red-100 text-red-800 border-red-200';
      case RequestPriority.HIGH:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case RequestPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RequestPriority.LOW:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">الحالة الحالية</h2>
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${getStatusColor(machine.status as MachineStatus)}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {machineStatusLabels[machine.status as MachineStatus] || machine.status}
          </span>
        </div>
      </div>

      {activeRequests.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-3">
            طلبات الصيانة النشطة ({activeRequests.length})
          </p>
          {activeRequests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900">{request.title}</h3>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
                      request.priority as RequestPriority
                    )}`}
                  >
                    {maintenanceRequestPriorityLabels[request.priority as RequestPriority] || request.priority}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getRequestStatusColor(
                      request.status as RequestStatus
                    )}`}
                  >
                    {maintenanceRequestStatusLabels[request.status as RequestStatus] || request.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{request.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>تم الطلب: {formatDateArabic(request.requestedDate, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</span>
                {request.expectedCompletionDate && (
                  <span>
                    متوقع الإنجاز:{' '}
                    {formatDateArabic(request.expectedCompletionDate, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2">لا توجد طلبات صيانة نشطة</p>
        </div>
      )}
    </div>
  );
};

export default MachineStatusPanel;

