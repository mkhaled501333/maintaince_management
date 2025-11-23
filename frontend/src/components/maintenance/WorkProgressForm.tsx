'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { maintenanceWorkApi, MaintenanceWork, MaintenanceWorkUpdate, MaintenanceWorkStart } from '../../lib/api/maintenance-work';
import { MaintenanceRequest, WorkStatus } from '../../lib/types';

interface WorkProgressFormProps {
  request: MaintenanceRequest;
  work?: MaintenanceWork | null;
  onSave?: () => void;
}

export function WorkProgressForm({ request, work, onSave }: WorkProgressFormProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [workDescription, setWorkDescription] = useState('');
  
  const queryClient = useQueryClient();

  // Initialize form with existing work data
  useEffect(() => {
    if (work) {
      setWorkDescription(work.workDescription || '');
      setIsDirty(false);
    }
  }, [work]);

  // Track form changes
  useEffect(() => {
    if (work) {
      const hasChanges = workDescription !== (work.workDescription || '');
      setIsDirty(hasChanges);
    } else {
      setIsDirty(workDescription.trim() !== '');
    }
  }, [workDescription, work]);

  const updateWorkMutation = useMutation({
    mutationFn: (data: MaintenanceWorkUpdate) => {
      if (!work?.id) {
        throw new Error('Work ID is required for update');
      }
      return maintenanceWorkApi.updateWork(work.id, data);
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['maintenance-work-by-request', request.id] });
      queryClient.invalidateQueries({ queryKey: ['my-work-requests'] });
      if (onSave) {
        onSave();
      }
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: (data: MaintenanceWorkStart) => {
      if (!work?.id) {
        throw new Error('Work ID is required to start work');
      }
      return maintenanceWorkApi.startWork(work.id, data);
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['maintenance-work-by-request', request.id] });
      queryClient.invalidateQueries({ queryKey: ['my-work-requests'] });
      if (onSave) {
        onSave();
      }
    },
  });

  const createWorkMutation = useMutation({
    mutationFn: (data: MaintenanceWorkUpdate & { requestId: number }) => {
      return maintenanceWorkApi.createWork({
        requestId: data.requestId,
        workDescription: data.workDescription,
        maintenanceSteps: data.maintenanceSteps,
      });
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['my-work-requests'] });
      if (onSave) {
        onSave();
      }
    },
  });

  const handleSave = async () => {
    const updateData: MaintenanceWorkUpdate = {
      workDescription: workDescription.trim() || undefined,
    };

    try {
      if (work?.id) {
        await updateWorkMutation.mutateAsync(updateData);
      } else {
        await createWorkMutation.mutateAsync({ ...updateData, requestId: request.id });
      }
    } catch (error) {
      console.error('فشل حفظ تقدم العمل:', error);
      alert('فشل حفظ تقدم العمل. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleStartWork = async () => {
    const startData: MaintenanceWorkStart = {
      workDescription: workDescription.trim() || undefined,
    };

    try {
      if (work?.id) {
        await startWorkMutation.mutateAsync(startData);
      } else {
        await createWorkMutation.mutateAsync({ ...startData, requestId: request.id });
      }
    } catch (error) {
      console.error('فشل بدء العمل:', error);
      alert('فشل بدء العمل. يرجى المحاولة مرة أخرى.');
    }
  };

  const isSaving = updateWorkMutation.isPending || createWorkMutation.isPending || startWorkMutation.isPending;

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white text-gray-900 rounded-lg p-3 shadow-sm">
      {/* Unsaved changes indicator */}
      {isDirty && (
        <div className="mb-3 flex items-center text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
          <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          لديك تغييرات غير محفوظة
        </div>
      )}

      <div className="space-y-4">
        {/* Work Description Card */}
        <div className="p-0">
          <textarea
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            rows={4}
            placeholder="أدخل وصفاً تفصيلياً للعمل الجاري تنفيذه..."
            className="w-full px-3 py-2 rounded-md border-2 border-gray-300 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm text-gray-900 placeholder:text-gray-400 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1.5">صف أعمال الصيانة بالتفصيل</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
          {work?.status === WorkStatus.PENDING && (
            <button
              type="button"
              onClick={handleStartWork}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isSaving ? 'جاري البدء...' : 'بدء العمل'}
            </button>
          )}
          
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isSaving ? 'جاري الحفظ...' : 'حفظ التقدم'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

