'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MaintenanceRequest, RequestStatus, UserRole, SparePartsRequest, AttachmentBasicInfo, MachineStatus } from '../../lib/types';
import { getApiBaseUrl } from '../../lib/api-config';
import { useAuth } from '../../lib/auth';
import {
  maintenanceRequestStatusLabels,
  machineStatusLabels,
  formatDateArabic,
} from '../../lib/locale';
import { WorkProgressForm } from './WorkProgressForm';
import { MaintenanceWorkProgress } from './MaintenanceWorkProgress';
import { maintenanceWorkApi } from '../../lib/api/maintenance-work';
import { SparePartsRequestForm } from './SparePartsRequestForm';
import { SparePartsRequestsList } from './SparePartsRequestsList';
import { RequestApproval } from './RequestApproval';
import FileUploadSection from '../attachments/FileUploadSection';
import { attachmentsApi } from '../../lib/api/attachments';
import { machineApi } from '../../lib/api/machines';
import { AuthenticatedImage } from '../attachments/AuthenticatedImage';

interface RequestDetailModalProps {
  request: MaintenanceRequest;
  isOpen: boolean;
  onClose: () => void;
  forceShowWorkProgress?: boolean;
}

export function RequestDetailModal({ request, isOpen, onClose, forceShowWorkProgress = false }: RequestDetailModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRequestForApproval, setSelectedRequestForApproval] = useState<SparePartsRequest | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentBasicInfo | null>(null);
  const [previewMachineImage, setPreviewMachineImage] = useState<AttachmentBasicInfo | null>(null);
  const isTechnician = user?.role === UserRole.MAINTENANCE_TECH;
  const isManager = user?.role === UserRole.MAINTENANCE_MANAGER;
  const isInventoryManager = user?.role === UserRole.INVENTORY_MANAGER;
  const showWorkProgress = forceShowWorkProgress 
    ? (request.status === RequestStatus.IN_PROGRESS || request.status === RequestStatus.WAITING_PARTS || request.status === RequestStatus.COMPLETED)
    : (isTechnician && (request.status === RequestStatus.IN_PROGRESS || request.status === RequestStatus.COMPLETED));
  
  // Fetch machine information to get location
  const { data: machine } = useQuery({
    queryKey: ['machine', request.machineId],
    queryFn: () => machineApi.getMachine(request.machineId),
    enabled: isOpen && !!request.machineId,
  });

  // Fetch maintenance work to get work ID for spare parts requests and work progress
  const { data: maintenanceWork } = useQuery({
    queryKey: ['maintenance-work-by-request', request.id],
    queryFn: () => maintenanceWorkApi.getWorkByRequest(request.id),
    enabled: isOpen && (request.status === RequestStatus.IN_PROGRESS || request.status === RequestStatus.WAITING_PARTS || request.status === RequestStatus.COMPLETED),
  });

  // List attachments for this request
  const { data: attachments = [], refetch: refetchAttachments } = useQuery<AttachmentBasicInfo[]>({
    queryKey: ['attachments', 'MAINTENANCE_REQUEST', request.id],
    queryFn: () => attachmentsApi.list('MAINTENANCE_REQUEST', request.id),
    enabled: isOpen,
  });

  // Fetch machine image attachments
  const { data: machineAttachments = [] } = useQuery<AttachmentBasicInfo[]>({
    queryKey: ['attachments', 'MACHINE', request.machineId],
    queryFn: () => attachmentsApi.list('MACHINE', request.machineId),
    enabled: isOpen && !!request.machineId,
  });

  const machineImages = machineAttachments.filter(a => a.mimeType.startsWith('image/'));
  const firstMachineImage = machineImages[0];

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case RequestStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case RequestStatus.WAITING_PARTS:
        return 'bg-purple-100 text-purple-800';
      case RequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case RequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMachineStatusColor = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL:
        return 'bg-green-100 text-green-800';
      case MachineStatus.DOWN:
        return 'bg-red-100 text-red-800';
      case MachineStatus.MAINTENANCE:
        return 'bg-yellow-100 text-yellow-800';
      case MachineStatus.DECOMMISSIONED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[1000] transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Left Side Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-full max-w-md sm:max-w-lg md:max-w-xl bg-white shadow-2xl z-[1001] transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-blue-50 border-b border-blue-200 px-4 py-3 z-10 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors touch-manipulation"
              aria-label="العودة"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-base sm:text-lg font-bold text-blue-900 flex-1">تفاصيل بلاغ الصيانة</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-blue-100 text-blue-600 hover:text-blue-800 transition-colors touch-manipulation"
              aria-label="إغلاق النافذة"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-2 sm:gap-3 px-4 py-4">
          {/* Combined Card - Machine Info, Request Info, Attachments */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm overflow-hidden">
            {/* Machine Data Section - First */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">معلومات الماكينة</h3>
              <div className="flex gap-3">
                {/* Machine Image */}
                <div className="flex-shrink-0 flex flex-col">
                  {firstMachineImage ? (
                    <div className="relative">
                      <AuthenticatedImage
                        attachmentId={firstMachineImage.id}
                        alt={firstMachineImage.description || 'Machine image'}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => setPreviewMachineImage(firstMachineImage)}
                      />
                      {machineImages.length > 1 && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          +{machineImages.length - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Image Description */}
                  {firstMachineImage?.description && (
                    <p className="mt-1 text-[10px] text-gray-600 text-center line-clamp-1 max-w-[80px] sm:max-w-[96px]">
                      {firstMachineImage.description}
                    </p>
                  )}
                  {/* Location under image without header */}
                  {machine?.location && (
                    <div className="mt-2 text-center">
                      <span className="text-xs font-medium text-gray-900 break-words flex items-center justify-center gap-1">
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {machine.location}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Machine Details */}
                <div className="flex-1 grid grid-cols-2 gap-x-1 sm:gap-x-3 gap-y-0.0">
                  {/* First Row: Machine ID next to Type ID */}
                  <div className="min-w-0">
                    <span className="text-xs text-gray-500 block">رقم الماكينة</span>
                    <span className="text-xs font-medium text-gray-900 break-words">{request.machineId}</span>
                  </div>
                  {request.maintenanceTypeId && (
                    <div className="min-w-0">
                      <span className="text-xs text-gray-500 block">نوع الصيانة</span>
                      <span className="text-xs font-medium text-gray-900 break-words">{request.maintenanceTypeId}</span>
                    </div>
                  )}
                  
                  {/* Second Row: Machine Name next to Failure Code */}
                  {machine?.name && (
                    <div className="min-w-0">
                      <span className="text-xs text-gray-500 block">اسم الماكينة</span>
                      <span className="text-xs font-medium text-gray-900 break-words">{machine.name}</span>
                    </div>
                  )}
                  {request.failureCodeId && (
                    <div className="min-w-0">
                      <span className="text-xs text-gray-500 block">كود العطل</span>
                      <span className="text-xs font-medium text-gray-900 break-words">{request.failureCodeId}</span>
                    </div>
                  )}
                  
                  {/* Third Row: Machine Status */}
                  {machine?.status && (
                    <div className="min-w-0 col-span-2">
                      <span className="text-xs text-gray-500 block mb-1">حالة الماكينة</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${getMachineStatusColor(machine.status)}`}>
                        {machineStatusLabels[machine.status]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Request Info Section */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">معلومات البلاغ</h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-500 whitespace-nowrap">رقم البلاغ:</span>
                  <span className="text-sm font-bold text-gray-900">#{request.id}</span>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${getStatusColor(request.status)}`}>
                  {maintenanceRequestStatusLabels[request.status]}
                </span>
              </div>
              {request.title && (
                <div className="mt-2 min-w-0">
                  <span className="text-xs text-gray-500">العنوان: </span>
                  <span className="text-sm font-medium text-gray-900 break-words">{request.title}</span>
                </div>
              )}
              <div className="mt-2 min-w-0">
                <span className="text-xs text-gray-500">الوصف: </span>
                <span className="text-sm text-gray-900 break-words">{request.description}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 block">مقدم البلاغ</span>
                  <span className="text-sm font-semibold text-gray-900 break-words">
                    {request.requestedByName || `المستخدم رقم ${request.requestedById}`}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-gray-500 block">تاريخ البلاغ</span>
                  <span className="text-sm text-gray-900 break-words">
                    {request.requestedDate ? formatDateArabic(request.requestedDate) : 'غير متوفر'}
                  </span>
                </div>
                {request.expectedCompletionDate && (
                  <div className="min-w-0">
                    <span className="text-xs text-gray-500 block">التاريخ المتوقع</span>
                    <span className="text-sm text-gray-900 break-words">{formatDateArabic(request.expectedCompletionDate)}</span>
                  </div>
                )}
                {request.actualCompletionDate && (
                  <div className="min-w-0">
                    <span className="text-xs text-gray-500 block">تاريخ الإكمال الفعلي</span>
                  <span className="text-sm text-gray-900 break-words">{formatDateArabic(request.actualCompletionDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Section - Compact */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-semibold text-gray-900">المرفقات</h3>
                {attachments.length > 0 && (
                  <span className="text-xs text-gray-500">({attachments.length})</span>
                )}
              </div>
              {/* List */}
              {attachments.length > 0 ? (
                <div className="flex flex-col gap-1 mb-1.5">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="border border-gray-200 rounded px-2 py-1 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => setPreviewAttachment(attachment)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 cursor-pointer break-words text-left touch-manipulation"
                            >
                              {attachment.originalFileName}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <a
                            href={`${getApiBaseUrl()}/maintenance-requests/attachments/${attachment.id}/file`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white border-none rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer no-underline hover:bg-blue-700 touch-manipulation transition-colors"
                          >
                            تحميل
                          </a>
                          {(user?.id === attachment.uploadedById || user?.role === UserRole.ADMIN) && (
                            <button
                              onClick={async () => {
                                if (!confirm('هل تريد حذف هذا المرفق؟')) return;
                                try {
                                  await attachmentsApi.delete(attachment.id);
                                  await refetchAttachments();
                                } catch (e) {
                                  alert('فشل الحذف');
                                }
                              }}
                              className="bg-red-500 text-white border-none rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer hover:bg-red-600 touch-manipulation transition-colors"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-1.5">لا توجد مرفقات</p>
              )}

              {/* Upload - Compact */}
              <div className="border-t border-gray-200 pt-1.5">
                <FileUploadSection onFilesUploaded={setPendingFiles} />
                {pendingFiles.length > 0 && (
                  <div className="mt-1.5 flex justify-end">
                    <button
                      onClick={async () => {
                        if (isUploading) return;
                        setIsUploading(true);
                        try {
                          for (const file of pendingFiles) {
                            await attachmentsApi.upload({
                              entityType: 'MAINTENANCE_REQUEST',
                              entityId: request.id,
                              file,
                            });
                          }
                          setPendingFiles([]);
                          await refetchAttachments();
                        } catch (e) {
                          alert('فشل الرفع');
                        } finally {
                          setIsUploading(false);
                        }
                      }}
                      className={`border-none rounded px-2 py-1 text-[10px] font-medium cursor-pointer touch-manipulation inline-flex items-center gap-1 transition-colors ${
                        isUploading 
                          ? 'bg-blue-300 text-white cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={isUploading}
                    >
                      {isUploading ? 'جاري الرفع...' : 'حفظ'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Work Progress for Technicians */}
          {showWorkProgress && (
            <div className="bg-white rounded-lg p-3 border-2 border-blue-500 shadow-md">
              <MaintenanceWorkProgress
                request={request}
                onWorkUpdate={() => {
                  // Refresh request details when work is updated
                }}
              />
            </div>
          )}

          {/* Spare Parts Requests Section */}
          {maintenanceWork && maintenanceWork.id && (
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-8 min-h-[400px] overflow-visible relative">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900">طلبات قطع الغيار</h3>
                {isTechnician && request.status === RequestStatus.IN_PROGRESS && !showRequestForm && (
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="bg-blue-600 text-white border-none rounded px-2 py-1 text-xs font-medium cursor-pointer hover:bg-blue-700 touch-manipulation w-full sm:w-auto inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    طلب قطع غيار
                  </button>
                )}
              </div>

              {showRequestForm && isTechnician ? (
                <div className="relative overflow-visible">
                  <SparePartsRequestForm
                    maintenanceWorkId={maintenanceWork.id}
                    onSave={() => {
                      setShowRequestForm(false);
                    }}
                    onCancel={() => setShowRequestForm(false)}
                  />
                </div>
              ) : (
                <div>
                  <SparePartsRequestsList 
                    maintenanceWorkId={maintenanceWork.id} 
                    onRequestClick={(spareRequest) => {
                      if (spareRequest.status === 'PENDING' && isManager) {
                        setSelectedRequestForApproval(spareRequest);
                      }
                    }}
                  />
                </div>
              )}
              
              {/* Request Approval Interface */}
              {selectedRequestForApproval && isManager && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <RequestApproval 
                    request={selectedRequestForApproval}
                    onComplete={() => {
                      setSelectedRequestForApproval(null);
                    }}
                  />
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white border-none rounded px-4 py-1.5 text-xs sm:text-sm font-medium cursor-pointer hover:bg-blue-700 touch-manipulation w-full sm:w-auto inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            إغلاق
          </button>
        </div>
      </div>

      {/* Preview Modal - Overlay on top of everything */}
      {previewAttachment && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-[1100] flex items-center justify-center p-2 sm:p-5"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="bg-white rounded-lg sm:rounded-lg p-3 sm:p-4 w-full max-w-full sm:max-w-[900px] max-h-[95vh] sm:max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="m-0 text-sm sm:text-base font-semibold text-gray-900 break-words pr-2">{previewAttachment.originalFileName}</h4>
              <button 
                onClick={() => setPreviewAttachment(null)} 
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm touch-manipulation flex-shrink-0 transition-colors"
              >
                إغلاق
              </button>
            </div>
            {previewAttachment.mimeType.startsWith('image/') ? (
              <img 
                src={`${getApiBaseUrl()}/maintenance-requests/attachments/${previewAttachment.id}/view`} 
                alt={previewAttachment.originalFileName} 
                className="max-w-full h-auto rounded-md" 
              />
            ) : previewAttachment.mimeType === 'application/pdf' ? (
              <iframe 
                src={`${getApiBaseUrl()}/maintenance-requests/attachments/${previewAttachment.id}/view`} 
                title="PDF Preview" 
                className="w-full h-[60vh] sm:h-[70vh] border-none" 
              />
            ) : (
              <div className="text-gray-500 text-sm">المعاينة غير متاحة. يرجى استخدام خيار التحميل.</div>
            )}
          </div>
        </div>
      )}

      {/* Machine Image Preview Modal */}
      {previewMachineImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-[1100] flex items-center justify-center p-2 sm:p-5"
          onClick={() => setPreviewMachineImage(null)}
        >
          <div
            className="bg-white rounded-lg sm:rounded-lg p-3 sm:p-4 w-full max-w-full sm:max-w-[900px] max-h-[95vh] sm:max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="m-0 text-sm sm:text-base font-semibold text-gray-900 break-words pr-2">
                {previewMachineImage.description || previewMachineImage.originalFileName || 'صورة الماكينة'}
              </h4>
              <div className="flex items-center gap-2">
                {machineImages.length > 1 && (
                  <span className="text-xs text-gray-600 font-medium">
                    {machineImages.findIndex(img => img.id === previewMachineImage.id) + 1} / {machineImages.length}
                  </span>
                )}
                <button 
                  onClick={() => setPreviewMachineImage(null)} 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm touch-manipulation flex-shrink-0 transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
            {previewMachineImage.mimeType.startsWith('image/') ? (
              <div className="relative">
                <AuthenticatedImage
                  attachmentId={previewMachineImage.id}
                  alt={previewMachineImage.description || previewMachineImage.originalFileName || 'Machine image'}
                  className="max-w-full h-auto rounded-md mx-auto"
                />
                {machineImages.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentIndex = machineImages.findIndex(img => img.id === previewMachineImage.id);
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : machineImages.length - 1;
                        setPreviewMachineImage(machineImages[prevIndex]);
                      }}
                      className="bg-blue-600 text-white border-none rounded px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-blue-700 touch-manipulation transition-colors"
                    >
                      السابق
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentIndex = machineImages.findIndex(img => img.id === previewMachineImage.id);
                        const nextIndex = currentIndex < machineImages.length - 1 ? currentIndex + 1 : 0;
                        setPreviewMachineImage(machineImages[nextIndex]);
                      }}
                      className="bg-blue-600 text-white border-none rounded px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-blue-700 touch-manipulation transition-colors"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">المعاينة غير متاحة. يرجى استخدام خيار التحميل.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}