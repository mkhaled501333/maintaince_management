'use client';

import { useState } from 'react';
import { MaintenanceWork, MaintenanceWorkComplete } from '../../lib/api/maintenance-work';

interface WorkCompletionFormProps {
  work: MaintenanceWork;
  onComplete: (data: MaintenanceWorkComplete) => void;
  isLoading?: boolean;
}

export function WorkCompletionForm({ work, onComplete, isLoading = false }: WorkCompletionFormProps) {
  const workDescription = work.workDescription?.trim() || '';
  const [completionNotes, setCompletionNotes] = useState('');

  const handleNotesChange = (value: string) => {
    setCompletionNotes(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workDescription) {
      alert('يرجى إدخال وصف العمل في تبويب "تفاصيل العمل" قبل إنهاء المهمة.');
      return;
    }

    // Serialize maintenance steps to ensure completedAt is a string, not a Date object
    const serializedSteps = work.maintenanceSteps?.map(step => ({
      step: step.step,
      description: step.description || '',
      completed: true, // Ensure all steps are marked as completed
      completedAt: step.completedAt 
        ? (typeof step.completedAt === 'string' 
          ? step.completedAt 
          : new Date(step.completedAt).toISOString())
        : undefined
    }));

    const completionData: MaintenanceWorkComplete = {
      workDescription,
      maintenanceSteps: serializedSteps,
      notes: completionNotes.trim() || undefined
    };

    onComplete(completionData);
  };

  const formatDuration = (startTime?: string) => {
    if (!startTime) return 'لم يبدأ';
    
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
      return `${hours}س ${minutes}د`;
    }
    return `${minutes} دقيقة`;
  };

  const completedSteps = work.maintenanceSteps?.filter(step => step.completed).length || 0;
  const totalSteps = work.maintenanceSteps?.length || 0;

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white text-gray-900 rounded-lg p-3 shadow-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
        <div className="flex gap-2">
          <svg className="h-3.5 w-3.5 text-yellow-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-xs font-medium text-yellow-800">إنهاء العمل</h3>
            <p className="text-xs text-yellow-700 mt-0.5">لا يمكن التراجع عن هذا الإجراء. تأكد من إكمال جميع الخطوات.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Work Summary */}
        <div className="bg-gray-50 rounded p-2">
          <h3 className="text-xs font-medium text-gray-900 mb-2">ملخص العمل</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-gray-700">المدة:</span>
              <span className="ml-1 text-gray-600">{formatDuration(work.startTime)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">الخطوات:</span>
              <span className="ml-1 text-gray-600">{completedSteps}/{totalSteps}</span>
            </div>
            <div className="col-span-2">
              <span className="font-medium text-gray-700">تاريخ البدء:</span>
              <span className="ml-1 text-gray-600">
                {work.startTime ? new Date(work.startTime).toLocaleDateString() : 'لم يبدأ'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Work Description */}
        <div className="border border-blue-100 bg-blue-50 rounded p-2">
          <h3 className="text-xs font-medium text-blue-800 mb-1">وصف العمل الحالي</h3>
          {workDescription ? (
            <p className="text-xs text-blue-700 leading-relaxed whitespace-pre-wrap">
              {workDescription}
            </p>
          ) : (
            <p className="text-xs text-red-600">
              لم يتم إدخال وصف للعمل بعد. يرجى إضافته من تبويب "تفاصيل العمل".
            </p>
          )}
        </div>

        {/* Completion Notes */}
        <div>
          <label htmlFor="completionNotes" className="block text-xs font-medium text-gray-700 mb-1">
            ملاحظات الإنهاء (اختياري)
          </label>
          <textarea
            id="completionNotes"
            value={completionNotes}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={2}
            placeholder="أي ملاحظات إضافية..."
            className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs"
          />
        </div>

        {/* Steps Summary */}
        {work.maintenanceSteps && work.maintenanceSteps.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-gray-900 mb-2">الخطوات المكتملة</h3>
            <div className="space-y-1.5">
              {work.maintenanceSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-1.5 rounded ${
                    step.completed
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {step.completed && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${step.completed ? 'text-green-800' : 'text-gray-600'}`}>
                      الخطوة {step.step}: {step.description || 'بدون وصف'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading || !workDescription.trim()}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الإنهاء...
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                إنهاء العمل
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
