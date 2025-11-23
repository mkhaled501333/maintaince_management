'use client';

import { useState, useEffect } from 'react';
import { MaintenanceWork, MaintenanceStep } from '../../lib/api/maintenance-work';

interface MaintenanceStepsListProps {
  work?: MaintenanceWork | null;
  onUpdate: (steps: MaintenanceStep[]) => void;
  isLoading?: boolean;
}

export function MaintenanceStepsList({ work, onUpdate, isLoading = false }: MaintenanceStepsListProps) {
  const [steps, setSteps] = useState<MaintenanceStep[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize steps from work data
  useEffect(() => {
    if (work?.maintenanceSteps && work.maintenanceSteps.length > 0) {
      setSteps(work.maintenanceSteps);
    } else {
      setSteps([
        { step: 1, description: '', completed: false }
      ]);
    }
    setIsDirty(false);
  }, [work]);

  // Track changes
  useEffect(() => {
    if (work?.maintenanceSteps) {
      const hasChanges = JSON.stringify(steps) !== JSON.stringify(work.maintenanceSteps);
      setIsDirty(hasChanges);
    } else {
      const hasContent = steps.some(s => s.description.trim() !== '');
      setIsDirty(hasContent);
    }
  }, [steps, work]);

  const handleAddStep = () => {
    const newStep: MaintenanceStep = {
      step: steps.length + 1,
      description: '',
      completed: false
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      // Renumber steps
      const renumberedSteps = newSteps.map((step, i) => ({
        ...step,
        step: i + 1
      }));
      setSteps(renumberedSteps);
    }
  };

  const handleStepChange = (index: number, field: 'description' | 'completed', value: string | boolean) => {
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value,
      completedAt: field === 'completed' && value ? new Date().toISOString() : newSteps[index].completedAt,
    };
    setSteps(newSteps);
  };

  const handleSave = () => {
    // Validate step completion sequence
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].completed && i > 0) {
        const prevStep = steps[i - 1];
        if (!prevStep.completed) {
          alert(`لا يمكن إكمال الخطوة ${steps[i].step} قبل إكمال الخطوة ${prevStep.step}`);
          return;
        }
      }
    }

    // Serialize steps to ensure completedAt is a string, not a Date object
    const serializedSteps = steps.map(step => ({
      step: step.step,
      description: step.description || '',
      completed: step.completed,
      completedAt: step.completedAt 
        ? (typeof step.completedAt === 'string' 
          ? step.completedAt 
          : new Date(step.completedAt).toISOString())
        : undefined
    }));

    onUpdate(serializedSteps);
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="space-y-3 w-full max-w-full overflow-x-hidden bg-white text-gray-900 rounded-lg p-3 shadow-sm">
      {/* Progress Overview */}
      <div className="bg-gray-50 rounded p-2">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-medium text-gray-900">نظرة عامة على التقدم</h3>
          <span className="text-xs text-gray-600">
            {completedSteps}/{totalSteps}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {progressPercentage.toFixed(0)}٪ مكتمل
        </div>
      </div>

      {/* Steps List */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-semibold text-gray-900">خطوات الصيانة</h3>
          <button
            type="button"
            onClick={handleAddStep}
            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة
          </button>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-2 border rounded transition-colors ${
                step.completed
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={step.completed}
                  onChange={(e) => handleStepChange(index, 'completed', e.target.checked)}
                  className="h-3.5 w-3.5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <span className="text-xs font-medium text-gray-700">
                    الخطوة {step.step}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {step.completedAt && (
                      <span className="text-xs text-green-600">
                        {new Date(step.completedAt).toLocaleDateString()}
                      </span>
                    )}
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
                
                <input
                  type="text"
                  value={step.description}
                  onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                  placeholder="صف هذه الخطوة..."
                  className={`w-full rounded border shadow-sm focus:ring-1 text-xs ${
                    step.completed
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {isDirty && (
        <div className="flex justify-end pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الحفظ...
              </>
            ) : (
              'حفظ التقدم'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
