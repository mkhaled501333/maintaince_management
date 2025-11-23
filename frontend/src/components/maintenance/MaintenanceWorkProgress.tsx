'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceWorkApi, MaintenanceWork, MaintenanceWorkStart, MaintenanceWorkProgressUpdate, MaintenanceWorkComplete, MaintenanceStep } from '../../lib/api/maintenance-work';
import { MaintenanceRequest, WorkStatus, RequestStatus } from '../../lib/types';
import { MaintenanceStepsList } from './MaintenanceStepsList';
import { WorkProgressForm } from './WorkProgressForm';
import { WorkCompletionForm } from './WorkCompletionForm';

interface MaintenanceWorkProgressProps {
  request: MaintenanceRequest;
  onWorkUpdate?: () => void;
}

export function MaintenanceWorkProgress({ request, onWorkUpdate }: MaintenanceWorkProgressProps) {
  const [activeTab, setActiveTab] = useState<'progress' | 'steps' | 'complete'>('progress');
  const queryClient = useQueryClient();

  // Fetch existing work by request ID
  const { data: work, isLoading, error } = useQuery({
    queryKey: ['maintenance-work-by-request', request.id],
    queryFn: () => maintenanceWorkApi.getWorkByRequest(request.id),
    enabled: true,
  });

  // Start work mutation
  const startWorkMutation = useMutation({
    mutationFn: (data: MaintenanceWorkStart) => {
      if (!work?.id) {
        throw new Error('Work ID is required to start work');
      }
      return maintenanceWorkApi.startWork(work.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-work-by-request', request.id] });
      queryClient.invalidateQueries({ queryKey: ['my-work-requests'] });
      if (onWorkUpdate) {
        onWorkUpdate();
      }
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: (data: MaintenanceWorkProgressUpdate) => {
      if (!work?.id) {
        throw new Error('Work ID is required to update progress');
      }
      return maintenanceWorkApi.updateProgress(work.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-work-by-request', request.id] });
      queryClient.invalidateQueries({ queryKey: ['my-work-requests'] });
      if (onWorkUpdate) {
        onWorkUpdate();
      }
    },
  });

  // Complete work mutation
  const completeWorkMutation = useMutation({
    mutationFn: (data: MaintenanceWorkComplete) => {
      if (!work?.id) {
        throw new Error('Work ID is required to complete work');
      }
      return maintenanceWorkApi.completeWork(work.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-work-by-request', request.id] });
      queryClient.invalidateQueries({ queryKey: ['my-work-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-request', request.id] });
      if (onWorkUpdate) {
        onWorkUpdate();
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">حدث خطأ أثناء تحميل تقدم العمل</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>تعذر تحميل بيانات أعمال الصيانة. يرجى المحاولة مرة أخرى.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: WorkStatus) => {
    switch (status) {
      case WorkStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case WorkStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case WorkStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case WorkStatus.ON_HOLD:
        return 'bg-orange-100 text-orange-800';
      case WorkStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: WorkStatus) => {
    switch (status) {
      case WorkStatus.PENDING:
        return 'قيد الانتظار';
      case WorkStatus.IN_PROGRESS:
        return 'جاري التنفيذ';
      case WorkStatus.COMPLETED:
        return 'مكتمل';
      case WorkStatus.ON_HOLD:
        return 'متوقف مؤقتاً';
      case WorkStatus.CANCELLED:
        return 'ملغى';
      default:
        return status;
    }
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return 'لم يبدأ';
    if (!endTime) return 'قيد التنفيذ';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    return `${minutes} دقيقة`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const formattedHours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year}، ${formattedHours}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Header - Compact */}
      <div className="pb-2 mb-2 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900">تقدم العمل</h2>
            <p className="text-xs text-gray-600 truncate">بلاغ رقم {request.id} - {request.title}</p>
          </div>
          {work && (
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <div className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(work.status)}`}>
                {getStatusText(work.status)}
              </div>
              {work.startTime && (
                <div className="text-gray-500 text-[10px] sm:text-xs">
                  بدأ في: {formatDateTime(work.startTime)}
                </div>
              )}
              <div className="text-gray-600">
                المدة: {formatDuration(work.startTime, work.endTime)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation - Compact */}
      <div className="pb-2 mb-3 overflow-x-auto">
        <nav className="flex min-w-max bg-gray-50 rounded-lg p-1 gap-1.5">
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-1.5 px-3 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
              activeTab === 'progress'
                ? 'bg-white text-blue-600 border border-blue-500 shadow-sm'
                : 'text-gray-600 border border-transparent hover:text-gray-800 hover:bg-white hover:border-gray-300'
            }`}
          >
            تفاصيل العمل
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`py-1.5 px-3 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
              activeTab === 'steps'
                ? 'bg-white text-blue-600 border border-blue-500 shadow-sm'
                : 'text-gray-600 border border-transparent hover:text-gray-800 hover:bg-white hover:border-gray-300'
            }`}
          >
            متابعة الخطوات
          </button>
          {work && work.status === WorkStatus.IN_PROGRESS && 
           (request.status === RequestStatus.IN_PROGRESS || request.status === RequestStatus.WAITING_PARTS) && (
            <button
              onClick={() => setActiveTab('complete')}
              className={`py-1.5 px-3 rounded-md font-medium text-xs whitespace-nowrap transition-colors ${
                activeTab === 'complete'
                  ? 'bg-white text-blue-600 border border-blue-500 shadow-sm'
                  : 'text-gray-600 border border-transparent hover:text-gray-800 hover:bg-white hover:border-gray-300'
              }`}
            >
              إنهاء العمل
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content - Compact, No overflow */}
      <div className="w-full max-w-full overflow-x-hidden">
        {activeTab === 'progress' && (
          <WorkProgressForm
            request={request}
            work={work}
            onSave={() => {
              queryClient.invalidateQueries({ queryKey: ['maintenance-work-by-request', request.id] });
              if (onWorkUpdate) {
                onWorkUpdate();
              }
            }}
          />
        )}
        
        {activeTab === 'steps' && (
          <MaintenanceStepsList
            work={work}
            onUpdate={(steps: MaintenanceStep[]) => {
              if (work?.id) {
                updateProgressMutation.mutate({ maintenanceSteps: steps });
              }
            }}
            isLoading={updateProgressMutation.isPending}
          />
        )}
        
        {activeTab === 'complete' && work && 
         (request.status === RequestStatus.IN_PROGRESS || request.status === RequestStatus.WAITING_PARTS) && (
          <WorkCompletionForm
            work={work}
            onComplete={(data: MaintenanceWorkComplete) => {
              completeWorkMutation.mutate(data);
            }}
            isLoading={completeWorkMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
