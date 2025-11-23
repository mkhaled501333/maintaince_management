'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Machine, MaintenanceRequestCreate, RequestPriority, FailureCode, MaintenanceType, MachineStatus } from '@/lib/types';
import { maintenanceRequestApi } from '@/lib/api/maintenance-requests';
import { failureCodeApi } from '@/lib/api/failure-codes';
import { maintenanceTypeApi } from '@/lib/api/maintenance-types';
import FileUploadSection from '@/components/attachments/FileUploadSection';

interface ProblemReportingFormProps {
  machine: Machine | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProblemReportingForm: React.FC<ProblemReportingFormProps> = ({
  machine,
  onSuccess,
  onCancel,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [failureCodes, setFailureCodes] = useState<FailureCode[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MaintenanceRequestCreate>({
    defaultValues: {
      machineId: machine?.id || 0,
      priority: RequestPriority.MEDIUM,
      machineStatus: machine?.status || MachineStatus.OPERATIONAL,
    },
  });

  const selectedMachineStatus = watch('machineStatus', machine?.status || MachineStatus.OPERATIONAL);

  // Load failure codes and maintenance types
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [failureCodesData, maintenanceTypesData] = await Promise.all([
          failureCodeApi.listFailureCodes(),
          maintenanceTypeApi.listMaintenanceTypes(),
        ]);
        setFailureCodes(failureCodesData);
        setMaintenanceTypes(maintenanceTypesData);
      } catch (err: unknown) {
        console.error('Error loading dropdown data:', err);
      }
    };

    loadDropdownData();
  }, []);

  const onSubmit = async (data: MaintenanceRequestCreate) => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert form data (strings from selects) to proper types
      const requestData: MaintenanceRequestCreate = {
        machineId: machine?.id || 0,
        title: data.title,
        description: data.description,
        priority: data.priority as RequestPriority,
        machineStatus: data.machineStatus
          ? (typeof data.machineStatus === 'string'
              ? (data.machineStatus as MachineStatus)
              : data.machineStatus)
          : undefined,
        // Convert string IDs to numbers or undefined
        failureCodeId: data.failureCodeId 
          ? (typeof data.failureCodeId === 'string' ? parseInt(data.failureCodeId, 10) : data.failureCodeId)
          : undefined,
        maintenanceTypeId: data.maintenanceTypeId
          ? (typeof data.maintenanceTypeId === 'string' ? parseInt(data.maintenanceTypeId, 10) : data.maintenanceTypeId)
          : undefined,
        expectedCompletionDate: data.expectedCompletionDate,
      };
      
      // Validate that required fields are not empty strings after conversion
      if (requestData.failureCodeId === 0 || isNaN(requestData.failureCodeId as number)) {
        requestData.failureCodeId = undefined;
      }
      if (requestData.maintenanceTypeId === 0 || isNaN(requestData.maintenanceTypeId as number)) {
        requestData.maintenanceTypeId = undefined;
      }
      
      console.log('جاري إرسال بيانات البلاغ:', requestData);
      
      // Create maintenance request
      const maintenanceRequest = await maintenanceRequestApi.createRequest(requestData);

      // Upload files if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await maintenanceRequestApi.uploadAttachment(maintenanceRequest.id, file);
        }
      }

      onSuccess();
    } catch (err: unknown) {
      console.error('حدث خطأ أثناء إرسال بلاغ الصيانة:', err);
      const errorMessage = err instanceof Error && 'response' in err && 
        typeof err.response === 'object' && err.response !== null && 
        'data' in err.response && typeof err.response.data === 'object' && 
        err.response.data !== null && 'detail' in err.response.data
        ? String(err.response.data.detail)
        : 'تعذر إرسال بلاغ الصيانة';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">الإبلاغ عن مشكلة</h2>
            <p className="text-xs text-gray-500">تقديم طلب صيانة لهذه الماكينة</p>
          </div>
        </div>
      </div>

      {/* Machine Info Card */}
      {machine && (
        <div className="mb-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-white">{machine.name}</h3>
            </div>
          </div>
          <div className="px-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {machine.location && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">{machine.location}</span>
                </div>
              )}
              {machine.model && (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span className="text-sm text-gray-600">{machine.model}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Machine Operational Status */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">حالة تشغيل الماكينة</h3>
        <p className="text-xs text-blue-700 mb-3">
          هل الماكينة تعمل حالياً أم متوقفة؟ إذا كانت متوقفة، سيتم تحديث حالتها تلقائياً إلى <span className="font-semibold">متوقفة</span>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className={`flex items-center space-x-3 rounded-lg border ${selectedMachineStatus === MachineStatus.OPERATIONAL ? 'border-blue-500 bg-white shadow' : 'border-gray-200 bg-white'} px-4 py-3 cursor-pointer transition`}>
            <input
              type="radio"
              value={MachineStatus.OPERATIONAL}
              {...register('machineStatus', { required: 'يرجى تحديد حالة تشغيل الماكينة' })}
              className="form-radio text-blue-600"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">تعمل بشكل طبيعي</p>
              <p className="text-xs text-gray-500">سيتم الحفاظ على الحالة الحالية للماكينة</p>
            </div>
          </label>
          <label className={`flex items-center space-x-3 rounded-lg border ${selectedMachineStatus === MachineStatus.DOWN ? 'border-red-500 bg-white shadow' : 'border-gray-200 bg-white'} px-4 py-3 cursor-pointer transition`}>
            <input
              type="radio"
              value={MachineStatus.DOWN}
              {...register('machineStatus', { required: 'يرجى تحديد حالة تشغيل الماكينة' })}
              className="form-radio text-red-600"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">متوقفة عن العمل</p>
              <p className="text-xs text-gray-500">سيتم تعيين حالة الماكينة إلى متوقفة</p>
            </div>
          </label>
        </div>
        {errors.machineStatus && (
          <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errors.machineStatus.message}</span>
          </p>
        )}
        {selectedMachineStatus === MachineStatus.DOWN && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 012 0v4a1 1 0 01-2 0V7zm1 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
            </svg>
            <span>سيتم تحديث حالة الماكينة إلى "متوقفة" لمتابعة الصيانة بشكل أسرع.</span>
          </div>
        )}
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden machineId field */}
          <input type="hidden" {...register('machineId')} value={machine?.id || 0} />
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
              العنوان <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title', {
                required: 'العنوان مطلوب',
                minLength: { value: 1, message: 'يجب أن يكون العنوان حرفاً واحداً على الأقل' },
              })}
              type="text"
              id="title"
              className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
              placeholder="وصف موجز للمشكلة"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errors.title.message}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">
              وصف المشكلة <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'الوصف مطلوب',
                minLength: { value: 10, message: 'يجب أن يكون الوصف 10 أحرف على الأقل' },
              })}
              id="description"
              rows={6}
              className="mt-1 block w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none placeholder:text-gray-400"
              placeholder="قدم معلومات تفصيلية حول المشكلة..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errors.description.message}</span>
              </p>
            )}
          </div>

          {/* Priority and Failure Code Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-1.5">
                الأولوية <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('priority', { 
                    required: 'الأولوية مطلوبة',
                    validate: (value) => {
                      const val = value as string;
                      if (val === '' || val === undefined || val === null) {
                        return 'يرجى اختيار الأولوية';
                      }
                      return true;
                    }
                  })}
                  id="priority"
                  className="mt-1 block w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                >
                  <option value={RequestPriority.LOW}>منخفضة</option>
                  <option value={RequestPriority.MEDIUM}>متوسطة</option>
                  <option value={RequestPriority.HIGH}>عالية</option>
                  <option value={RequestPriority.CRITICAL}>حرجة</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-1">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.priority.message}</span>
                </p>
              )}
            </div>

            {/* Failure Code */}
            <div>
              <label htmlFor="failureCodeId" className="block text-sm font-semibold text-gray-700 mb-1.5">
                كود العطل <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  {...register('failureCodeId', {
                    required: 'كود العطل مطلوب',
                    validate: (value) => {
                      const val = value as string | number | undefined;
                      if (typeof val === 'string' && val === '') {
                        return 'يرجى اختيار كود العطل';
                      }
                      if (val === undefined || val === null || val === 0) {
                        return 'يرجى اختيار كود العطل';
                      }
                      return true;
                    }
                  })}
                  id="failureCodeId"
                  className="mt-1 block w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                >
                  <option value="">اختر كود العطل</option>
                  {failureCodes.map((code) => (
                    <option key={code.id} value={code.id}>
                      {code.code} - {code.description}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-1">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.failureCodeId && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.failureCodeId.message}</span>
                </p>
              )}
            </div>
          </div>

          {/* Maintenance Type */}
          <div>
            <label htmlFor="maintenanceTypeId" className="block text-sm font-semibold text-gray-700 mb-1.5">
              نوع الصيانة <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                {...register('maintenanceTypeId', {
                  required: 'نوع الصيانة مطلوب',
                  validate: (value) => {
                    const val = value as string | number | undefined;
                    if (typeof val === 'string' && val === '') {
                      return 'يرجى اختيار نوع الصيانة';
                    }
                    if (val === undefined || val === null || val === 0) {
                      return 'يرجى اختيار نوع الصيانة';
                    }
                    return true;
                  }
                })}
                id="maintenanceTypeId"
                className="mt-1 block w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
              >
                <option value="">اختر نوع الصيانة</option>
                {maintenanceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-1">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.maintenanceTypeId && (
              <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{errors.maintenanceTypeId.message}</span>
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="pt-1">
            <FileUploadSection
              onFilesUploaded={setUploadedFiles}
              maxFiles={10}
              acceptedTypes={['image/*', 'application/pdf', 'video/*']}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Submit and Cancel Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>جاري الإرسال...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>إرسال التقرير</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProblemReportingForm;
