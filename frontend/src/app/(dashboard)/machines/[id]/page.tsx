'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole, AttachmentBasicInfo } from '@/lib/types';
import { machineApi } from '@/lib/api/machines';
import { MachineDetailResponse, MachineStatus } from '@/lib/types';
import MachineStatusPanel from '@/components/machines/MachineStatusPanel';
import MaintenanceHistory from '@/components/machines/MaintenanceHistory';
import SparePartsRequirements from '@/components/machines/SparePartsRequirements';
import FileAttachmentsSection from '@/components/machines/FileAttachmentsSection';
import { useAuth } from '@/lib/auth';
import { machineStatusLabels, formatDateArabic } from '@/lib/locale';
import { attachmentsApi } from '@/lib/api/attachments';
import { getApiBaseUrl } from '@/lib/api-config';
import { AuthenticatedImage } from '@/components/attachments/AuthenticatedImage';

export default function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const machineId = parseInt(params.id as string);
  const [machineDetail, setMachineDetail] = useState<MachineDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [galleryImageIndex, setGalleryImageIndex] = useState(0);
  const isSupervisor = user?.role === UserRole.SUPERVISOR;
  const canUploadImage = user?.role === UserRole.ADMIN || 
                         user?.role === UserRole.MAINTENANCE_MANAGER || 
                         user?.role === UserRole.SUPERVISOR;

  useEffect(() => {
    loadMachineDetail();
  }, [machineId, historyPage]);

  const loadMachineDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await machineApi.getMachineDetail(machineId, {
        includeHistory: true,
        page: historyPage,
        pageSize: 10,
      });
      setMachineDetail(data);
    } catch (err: any) {
      console.error('Error loading machine detail:', err);
      const errorMessage = err?.response?.data?.detail || err?.message || 'فشل تحميل تفاصيل الماكينة';
      setError(errorMessage);
      
      // If it's a network error, provide more helpful information
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setError('خطأ في اتصال الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreHistory = () => {
    if (machineDetail && historyPage < machineDetail.maintenanceHistoryTotalPages) {
      setHistoryPage(historyPage + 1);
    }
  };

  // Get machine images - only those with descriptions
  const machineImages = machineDetail?.attachments.filter(a => 
    a.mimeType.startsWith('image/') && a.description && a.description.trim() !== ''
  ) || [];
  const firstImage = machineImages[0];

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImageFile || !machineDetail) return;

    setIsUploadingImage(true);
    try {
      await attachmentsApi.upload({
        entityType: 'MACHINE',
        entityId: machineDetail.id,
        file: selectedImageFile,
        // Always set description to "thumbnail" for machine images
        description: 'thumbnail',
      });
      // Reset form
      setSelectedImageFile(null);
      setImageDescription('');
      // Refresh machine detail
      await loadMachineDetail();
    } catch (err: any) {
      console.error('Error uploading image:', err);
      alert('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('يرجى اختيار ملف صورة');
        return;
      }
      // Validate file size (max 50MB)
      // Note: Files are uploaded in original quality without compression
      if (file.size > 50 * 1024 * 1024) {
        alert('حجم الملف يتجاوز 50 ميجابايت');
        return;
      }
      // File is used as-is without any processing to preserve original quality
      setSelectedImageFile(file);
    }
  };

  // Render loading state
  if (loading && !machineDetail) {
    return (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.SUPERVISOR, UserRole.MAINTENANCE_TECH]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">جاري تحميل تفاصيل الماكينة...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Render error state
  if (error || !machineDetail) {
    return (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.SUPERVISOR, UserRole.MAINTENANCE_TECH]}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 mb-4">خطأ: {error || 'لم يتم العثور على الماكينة'}</div>
            <button
              onClick={() => router.push('/machines')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              العودة إلى الماكينات
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const getStatusColor = (status: MachineStatus | string) => {
    switch (status as MachineStatus) {
      case MachineStatus.OPERATIONAL:
        return 'bg-green-100 text-green-800 border-green-200';
      case MachineStatus.DOWN:
        return 'bg-red-100 text-red-800 border-red-200';
      case MachineStatus.MAINTENANCE:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case MachineStatus.DECOMMISSIONED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string | null | undefined) => formatDateArabic(dateString ?? undefined);

  // Render main content
  if (isSupervisor) {
    // Enhanced Supervisor View
    return (
      <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.SUPERVISOR, UserRole.MAINTENANCE_TECH]}>
        {/* Enhanced Header for Supervisor */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.push('/machines')}
              className="text-blue-100 hover:text-white mb-3 flex items-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">العودة إلى الماكينات</span>
            </button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{machineDetail.name}</h1>
                  <p className="text-blue-100 mt-1 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {machineDetail.department?.name || 'بدون قسم'} • {machineDetail.location || 'بدون موقع'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 backdrop-blur-sm ${
                  machineDetail.status === 'OPERATIONAL' ? 'bg-white/20 text-white border-white/30' :
                  machineDetail.status === 'DOWN' ? 'bg-red-500/20 text-white border-red-300/30' :
                  machineDetail.status === 'MAINTENANCE' ? 'bg-yellow-500/20 text-white border-yellow-300/30' :
                  'bg-gray-500/20 text-white border-gray-300/30'
                }`}>
                  <div className={`h-3 w-3 rounded-full ${
                    machineDetail.status === 'OPERATIONAL' ? 'bg-green-300' :
                    machineDetail.status === 'DOWN' ? 'bg-red-300' :
                    machineDetail.status === 'MAINTENANCE' ? 'bg-yellow-300' :
                    'bg-gray-300'
                  } animate-pulse`}></div>
                  {machineStatusLabels[machineDetail.status as MachineStatus] || machineDetail.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
              {/* Machine Information Card - Enhanced */}
              <div className="lg:col-span-1 bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 border-b border-gray-200">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    معلومات الماكينة
                  </h2>
                </div>
                <div className="p-3">
                  {/* Machine Image Section */}
                  <div className="mb-3 pb-3 border-b border-gray-200">
                    <div className="flex flex-col items-center gap-2">
                      {/* Image Display */}
                      {firstImage ? (
                        <div className="relative group">
                          <AuthenticatedImage
                            attachmentId={firstImage.id}
                            alt={firstImage.description || 'Machine image'}
                            className="w-28 h-28 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={() => {
                              if (machineImages.length > 1) {
                                setShowImageGallery(true);
                                setGalleryImageIndex(0);
                              }
                            }}
                          />
                          {machineImages.length > 1 && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                              +{machineImages.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-28 h-28 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      {/* Image Description - Always show if exists */}
                      {firstImage?.description ? (
                        <p className="text-xs text-gray-600 text-center max-w-[200px] line-clamp-2">
                          {firstImage.description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 text-center max-w-[200px]">
                          لا يوجد وصف
                        </p>
                      )}
                      {/* Upload Section */}
                      {canUploadImage && (
                        <div className="w-full space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            id="machine-image-upload"
                          />
                          <label
                            htmlFor="machine-image-upload"
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            إضافة صورة
                          </label>
                        {selectedImageFile && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <p className="font-medium truncate">{selectedImageFile.name}</p>
                              <p className="text-gray-500">{(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              <p className="text-gray-400 mt-1">سيتم حفظ الصورة كصورة مصغرة</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleImageUpload}
                                disabled={isUploadingImage}
                                className="flex-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                              >
                                {isUploadingImage ? 'جاري الرفع...' : 'رفع'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedImageFile(null);
                                  setImageDescription('');
                                }}
                                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        الطراز
                      </div>
                      <p className="text-sm font-medium text-gray-900 pl-5">{machineDetail.model || 'غير متاح'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        الرقم التسلسلي
                      </div>
                      <p className="text-sm font-medium text-gray-900 pl-5 font-mono">{machineDetail.serialNumber || 'غير متاح'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        القسم
                      </div>
                      <p className="text-sm font-medium text-gray-900 pl-5">{machineDetail.department?.name || 'غير متاح'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        الموقع
                      </div>
                      <p className="text-sm font-medium text-gray-900 pl-5">{machineDetail.location || 'غير متاح'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        تاريخ التركيب
                      </div>
                      <p className="text-sm font-medium text-gray-900 pl-5">{formatDate(machineDetail.installationDate)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        رمز QR
                      </div>
                      <p className="text-sm font-medium text-gray-900 pl-5 font-mono text-xs bg-gray-50 px-2 py-0.5 rounded inline-block">{machineDetail.qrCode || 'غير متاح'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Card */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 border-b border-gray-200">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    إحصائيات سريعة
                  </h2>
                </div>
                <div className="p-3 space-y-2">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="text-xl font-bold text-blue-600">{machineDetail.totalMaintenanceCount}</div>
                    <div className="text-xs text-gray-600 mt-0.5">إجمالي أعمال الصيانة</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                    <div className="text-xl font-bold text-orange-600">{machineDetail.activeMaintenance.length}</div>
                    <div className="text-xs text-gray-600 mt-0.5">طلبات نشطة</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <div className="text-xl font-bold text-purple-600">{machineDetail.sparePartsRequirements.length}</div>
                    <div className="text-xs text-gray-600 mt-0.5">قطع الغيار</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                    <div className="text-xl font-bold text-indigo-600">{machineDetail.attachments.length}</div>
                    <div className="text-xs text-gray-600 mt-0.5">المرفقات</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Maintenance Status */}
            <MachineStatusPanel
              machine={machineDetail}
              activeRequests={machineDetail.activeMaintenance}
            />

            {/* Maintenance History */}
            <MaintenanceHistory
              history={machineDetail.maintenanceHistory}
              pagination={{
                page: machineDetail.maintenanceHistoryPage,
                pageSize: machineDetail.maintenanceHistoryPageSize,
                totalPages: machineDetail.maintenanceHistoryTotalPages,
              }}
              onLoadMore={handleLoadMoreHistory}
            />

            {/* Spare Parts Requirements */}
            <SparePartsRequirements
              requirements={machineDetail.sparePartsRequirements}
            />

            {/* File Attachments */}
            <FileAttachmentsSection
              machineId={machineDetail.id}
              attachments={machineDetail.attachments}
            />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Standard View for Other Roles
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.MAINTENANCE_MANAGER, UserRole.SUPERVISOR, UserRole.MAINTENANCE_TECH]}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/machines')}
                className="text-gray-600 hover:text-gray-900 mb-2 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                العودة إلى الماكينات
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{machineDetail.name}</h1>
              <p className="text-sm text-gray-500">تفاصيل الماكينة</p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                machineDetail.status
              )}`}
            >
              {machineStatusLabels[machineDetail.status as MachineStatus] || machineDetail.status}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Machine Information Card */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الماكينة</h2>
          {/* Machine Image Section for Standard View */}
          {machineDetail && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex flex-col items-center gap-2">
                {firstImage ? (
                  <div className="relative">
                    <AuthenticatedImage
                      attachmentId={firstImage.id}
                      alt={firstImage.description || 'Machine image'}
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => {
                        if (machineImages.length > 1) {
                          setShowImageGallery(true);
                          setGalleryImageIndex(0);
                        }
                      }}
                    />
                    {machineImages.length > 1 && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        +{machineImages.length - 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* Image Description - Always show if exists */}
                {firstImage?.description ? (
                  <p className="text-sm text-gray-600 text-center max-w-[200px] line-clamp-2">
                    {firstImage.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 text-center max-w-[200px]">
                    لا يوجد وصف
                  </p>
                )}
                {/* Upload Section for Standard View */}
                {canUploadImage && (
                  <div className="w-full space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="machine-image-upload-standard"
                    />
                    <label
                      htmlFor="machine-image-upload-standard"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      إضافة صورة
                    </label>
                  {selectedImageFile && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <p className="font-medium truncate">{selectedImageFile.name}</p>
                        <p className="text-gray-500">{(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="text-gray-400 mt-1">سيتم حفظ الصورة كصورة مصغرة</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleImageUpload}
                          disabled={isUploadingImage}
                          className="flex-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isUploadingImage ? 'جاري الرفع...' : 'رفع'}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedImageFile(null);
                            setImageDescription('');
                          }}
                          className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">الطراز</label>
              <p className="text-gray-900">{machineDetail.model || 'غير متاح'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">الرقم التسلسلي</label>
              <p className="text-gray-900">{machineDetail.serialNumber || 'غير متاح'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">القسم</label>
              <p className="text-gray-900">{machineDetail.department?.name || 'غير متاح'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">الموقع</label>
              <p className="text-gray-900">{machineDetail.location || 'غير متاح'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">تاريخ التركيب</label>
              <p className="text-gray-900">{formatDate(machineDetail.installationDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">رمز QR</label>
              <p className="text-gray-900 font-mono text-sm">{machineDetail.qrCode || 'غير متاح'}</p>
            </div>
          </div>
        </div>

        {/* Active Maintenance Status */}
        <MachineStatusPanel
          machine={machineDetail}
          activeRequests={machineDetail.activeMaintenance}
        />

        {/* Maintenance History */}
        <MaintenanceHistory
          history={machineDetail.maintenanceHistory}
          pagination={{
            page: machineDetail.maintenanceHistoryPage,
            pageSize: machineDetail.maintenanceHistoryPageSize,
            totalPages: machineDetail.maintenanceHistoryTotalPages,
          }}
          onLoadMore={handleLoadMoreHistory}
        />

        {/* Spare Parts Requirements */}
        <SparePartsRequirements
          requirements={machineDetail.sparePartsRequirements}
        />

        {/* File Attachments */}
        <FileAttachmentsSection
          machineId={machineDetail.id}
          attachments={machineDetail.attachments}
          onAttachmentAdded={loadMachineDetail}
        />
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && machineImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageGallery(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                صور الماكينة ({galleryImageIndex + 1} / {machineImages.length})
              </h3>
              <button
                onClick={() => setShowImageGallery(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="relative">
                <AuthenticatedImage
                  attachmentId={machineImages[galleryImageIndex].id}
                  alt={machineImages[galleryImageIndex].description || `Machine image ${galleryImageIndex + 1}`}
                  className="w-full h-auto rounded-lg"
                />
                {machineImages[galleryImageIndex].description && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{machineImages[galleryImageIndex].description}</p>
                  </div>
                )}
                {machineImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setGalleryImageIndex((prev) => (prev > 0 ? prev - 1 : machineImages.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setGalleryImageIndex((prev) => (prev < machineImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

