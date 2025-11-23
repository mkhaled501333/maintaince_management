'use client';

import React, { useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole, Machine, MachineStatus } from '@/lib/types';
import { machineStatusLabels } from '@/lib/locale';
import QRScanner from '@/components/qr-scanner/QRScanner';
import CameraCapture from '@/components/admin/CameraCapture';
import { machineApi } from '@/lib/api/machines';
import { attachmentsApi } from '@/lib/api/attachments';

type Step = 1 | 2 | 3 | 4;

export default function UploadMachineImagePage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCameraCapture, setShowCameraCapture] = useState(false);

  const steps = [
    { number: 1, label: 'مسح QR', description: 'امسح رمز QR للماكينة' },
    { number: 2, label: 'تحديد الماكينة', description: 'تأكد من معلومات الماكينة' },
    { number: 3, label: 'التقاط الصورة', description: 'التقط صورة للماكينة' },
    { number: 4, label: 'الرفع', description: 'رفع الصورة إلى النظام' },
  ];

  // Step 1: Handle QR code scan
  const handleQRScanSuccess = useCallback(async (scannedCode: string) => {
    setQrCode(scannedCode);
    setError(null);
    setShowQRScanner(false);
    setIsLoading(true);

    try {
      const machineData = await machineApi.getMachineByQRCode(scannedCode);
      setMachine(machineData);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Error fetching machine:', err);
      let errorMessage = 'فشل في العثور على الماكينة';
      
      if (err?.response?.status === 404) {
        errorMessage = 'لم يتم العثور على الماكينة برمز QR هذا. يرجى التحقق من الرمز والمحاولة مرة أخرى.';
      } else if (err?.response?.status === 401 || err?.response?.status === 403) {
        errorMessage = 'ليس لديك صلاحية للوصول إلى هذه الماكينة.';
      } else if (err?.message?.includes('Network')) {
        errorMessage = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالمحاولة مرة أخرى.';
      } else {
        errorMessage = err?.response?.data?.detail || err?.message || 'حدث خطأ أثناء البحث عن الماكينة.';
      }
      
      setError(errorMessage);
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQRScanError = useCallback((error: string) => {
    setError(error);
  }, []);

  // Step 4: Upload image
  const handleUpload = useCallback(async (file: File) => {
    if (!machine) {
      setError('معلومات الماكينة غير متوفرة');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      await attachmentsApi.upload({
        entityType: 'MACHINE',
        entityId: machine.id,
        file: file,
        description: 'thumbnail',
      });

      setUploadProgress(100);
      setIsUploadSuccess(true);
    } catch (err: any) {
      console.error('Error uploading image:', err);
      let errorMessage = 'فشل في رفع الصورة';
      
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        errorMessage = 'ليس لديك صلاحية لرفع الصور.';
      } else if (err?.response?.status === 413) {
        errorMessage = 'حجم الصورة كبير جداً. يرجى اختيار صورة أصغر.';
      } else if (err?.message?.includes('Network')) {
        errorMessage = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك والمحاولة مرة أخرى.';
      } else {
        errorMessage = err?.response?.data?.detail || err?.message || 'حدث خطأ أثناء رفع الصورة.';
      }
      
      setError(errorMessage);
      setUploadProgress(null);
    } finally {
      setIsLoading(false);
    }
  }, [machine]);

  // Step 2: Proceed to camera capture
  const handleProceedToCapture = useCallback(() => {
    setError(null);
    setShowCameraCapture(true);
    setCurrentStep(3);
  }, []);

  // Step 3: Handle image capture
  const handleImageCapture = useCallback((file: File) => {
    setCapturedImage(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setCapturedImagePreview(previewUrl);
    setShowCameraCapture(false);
    setError(null);
    setCurrentStep(4);
    
    // Automatically start upload
    handleUpload(file);
  }, [handleUpload]);

  const handleCameraError = useCallback((error: string) => {
    setError(error);
  }, []);

  // Reset and start over
  const handleStartOver = useCallback(() => {
    // Clean up preview URL
    if (capturedImagePreview) {
      URL.revokeObjectURL(capturedImagePreview);
    }
    setCurrentStep(1);
    setQrCode(null);
    setMachine(null);
    setCapturedImage(null);
    setCapturedImagePreview(null);
    setError(null);
    setIsLoading(false);
    setUploadProgress(null);
    setIsUploadSuccess(false);
    setShowQRScanner(false);
    setShowCameraCapture(false);
  }, [capturedImagePreview]);

  // Retry QR scan
  const handleRetryQRScan = useCallback(() => {
    setError(null);
    setShowQRScanner(true);
  }, []);

  // Retry upload
  const handleRetryUpload = useCallback(() => {
    if (capturedImage) {
      setError(null);
      handleUpload(capturedImage);
    }
  }, [capturedImage, handleUpload]);

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">اضافه صوره للماكينه </h1>
            <p className="text-gray-600">
              امسح رمز QR للماكينة والتقط صورة لرفعها كصورة مصغرة
            </p>
          </div>

          {/* Step Indicators */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all ${
                        currentStep === step.number
                          ? 'bg-indigo-600 text-white shadow-lg scale-110'
                          : currentStep > step.number
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div
                        className={`text-sm font-medium ${
                          currentStep === step.number
                            ? 'text-indigo-600'
                            : currentStep > step.number
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition-all ${
                        currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Step 1: QR Code Scan */}
            {currentStep === 1 && (
              <div className="text-center py-12">
                {!showQRScanner ? (
                  <>
                    <div className="mb-6">
                      <svg className="w-24 h-24 mx-auto text-indigo-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        امسح رمز QR للماكينة
                      </h2>
                      <p className="text-gray-600 mb-6">
                        اضغط على الزر أدناه لفتح ماسح QR وامسح رمز QR الموجود على الماكينة
                      </p>
                    </div>
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      فتح ماسح QR
                    </button>
                  </>
                ) : (
                  <QRScanner
                    onScanSuccess={handleQRScanSuccess}
                    onError={handleQRScanError}
                    onClose={() => setShowQRScanner(false)}
                  />
                )}

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">خطأ</span>
                    </div>
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                      onClick={handleRetryQRScan}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="mt-6 flex items-center justify-center gap-2 text-indigo-600">
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري البحث عن الماكينة...</span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Machine Identification */}
            {currentStep === 2 && machine && (
              <div className="py-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  تأكد من معلومات الماكينة
                </h2>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">اسم الماكينة</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{machine.name}</p>
                    </div>
                    {machine.model && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">الموديل</label>
                        <p className="text-lg text-gray-900 mt-1">{machine.model}</p>
                      </div>
                    )}
                    {machine.serialNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">الرقم التسلسلي</label>
                        <p className="text-lg text-gray-900 mt-1">{machine.serialNumber}</p>
                      </div>
                    )}
                    {machine.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">الموقع</label>
                        <p className="text-lg text-gray-900 mt-1">{machine.location}</p>
                      </div>
                    )}
                    {machine.department && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">القسم</label>
                        <p className="text-lg text-gray-900 mt-1">{machine.department.name}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">الحالة</label>
                      <p className="text-lg text-gray-900 mt-1">
                        {machineStatusLabels[machine.status as MachineStatus] || machine.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setMachine(null);
                      setQrCode(null);
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium"
                  >
                    رجوع
                  </button>
                  <button
                    onClick={handleProceedToCapture}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                  >
                    المتابعة إلى التقاط الصورة
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Camera Capture */}
            {currentStep === 3 && (
              <div className="text-center py-12">
                {!showCameraCapture ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        التقاط صورة الماكينة
                      </h2>
                      <p className="text-gray-600 mb-6">
                        اضغط على الزر أدناه لفتح الكاميرا والتقاط صورة للماكينة
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCameraCapture(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      فتح الكاميرا
                    </button>
                  </>
                ) : (
                  <CameraCapture
                    onCapture={handleImageCapture}
                    onError={handleCameraError}
                    onClose={() => setShowCameraCapture(false)}
                  />
                )}

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">خطأ</span>
                    </div>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Upload Progress & Success */}
            {currentStep === 4 && (
              <div className="text-center py-12">
                {isUploadSuccess ? (
                  <>
                    <div className="mb-6">
                      <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        تم رفع الصورة بنجاح!
                      </h2>
                      <p className="text-gray-600 mb-6">
                        تم رفع صورة الماكينة "{machine?.name}" بنجاح كصورة مصغرة
                      </p>
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={handleStartOver}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        رفع صورة أخرى
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        رفع الصورة
                      </h2>
                      <p className="text-gray-600 mb-6">
                        {isLoading ? 'جاري رفع الصورة...' : 'جاهز للرفع'}
                      </p>
                    </div>

                    {/* Captured Image Preview */}
                    {capturedImagePreview && (
                      <div className="mb-6 flex justify-center">
                        <div className="relative w-full max-w-md">
                          <img
                            src={capturedImagePreview}
                            alt="Captured machine photo"
                            className="w-full h-auto rounded-lg border-2 border-gray-200"
                          />
                        </div>
                      </div>
                    )}

                    {isLoading && (
                      <div className="mb-6">
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                          <div className="bg-indigo-600 h-4 rounded-full animate-pulse" style={{ width: '100%' }} />
                        </div>
                        <p className="text-sm text-gray-600">جاري الرفع...</p>
                      </div>
                    )}

                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800 mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">خطأ</span>
                        </div>
                        <p className="text-red-700 text-sm">{error}</p>
                        <button
                          onClick={handleRetryUpload}
                          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          إعادة المحاولة
                        </button>
                      </div>
                    )}

                    {!isLoading && !error && !isUploadSuccess && capturedImage && (
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => {
                            // Clean up preview URL
                            if (capturedImagePreview) {
                              URL.revokeObjectURL(capturedImagePreview);
                            }
                            setCurrentStep(3);
                            setCapturedImage(null);
                            setCapturedImagePreview(null);
                            setShowCameraCapture(true);
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium"
                        >
                          رجوع
                        </button>
                        <button
                          onClick={() => handleUpload(capturedImage)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                        >
                          رفع الصورة
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

