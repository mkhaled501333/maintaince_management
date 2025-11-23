'use client';

import React, { useState } from 'react';
import QRScanner from '@/components/qr-scanner/QRScanner';
import MachineDisplay from '@/components/qr-scanner/MachineDisplay';
import { machineApi } from '@/lib/api/machines';
import { Machine } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';
import ClientOnly from '@/components/ClientOnly';

const QRScannerPage: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedMachine, setScannedMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualQr, setManualQr] = useState<string>("");

  const handleScanSuccess = async (qrCodeData: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('QR Code scanned:', qrCodeData);
      
      // Parse QR code data to extract the QR code identifier
      // New format: just the UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
      // Old format (backward compatibility): "machine:{machine_id}:{qr_code_identifier}"
      let qrCodeIdentifier = qrCodeData.trim();
      
      // Check if the QR code follows the old format with machine prefix
      if (qrCodeData.includes(':')) {
        const parts = qrCodeData.split(':');
        if (parts.length >= 3 && parts[0] === 'machine') {
          // Old format: machine:id:qr_code
          // Extract the last part (the actual QR code identifier)
          qrCodeIdentifier = parts.slice(2).join(':'); // Handle cases where QR code might contain colons
          console.log('Extracted QR code identifier from old format:', qrCodeIdentifier);
        }
      }
      // New format: QR code is just the UUID (no machine: prefix)
      
      // Try to use the QR code to fetch machine data
      let machine: Machine;
      try {
        machine = await machineApi.getMachineByQRCode(qrCodeIdentifier);
        console.log('Machine found by QR code:', machine);
      } catch (qrError) {
        // If QR code lookup fails, try searching by name (for legacy QR codes)
        console.log('QR code lookup failed, trying to search by name:', qrCodeIdentifier);
        const searchResults = await machineApi.listMachines({ search: qrCodeIdentifier, pageSize: 10 });
        
        if (searchResults.machines.length > 0) {
          // Use the first matching machine
          machine = searchResults.machines[0];
          console.log('Machine found by name search:', machine);
        } else {
          throw new Error('لم يتم العثور على الماكينة. يرجى التحقق من رمز QR أو إعادة المحاولة.');
        }
      }
      
      setScannedMachine(machine);
      setShowScanner(false);
    } catch (err) {
      console.error('Error fetching machine data:', err);
      const errorMessage = err instanceof Error ? err.message : 'فشل تحميل معلومات الماكينة. يرجى إعادة المسح مرة أخرى.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanError = (error: string) => {
    console.error('QR Scanner error:', error);
    setError(error);
  };

  const handleMachineAction = (action: string) => {
    console.log('Machine action:', action, scannedMachine);
    
    switch (action) {
      case 'report-problem':
        if (scannedMachine) {
          window.location.href = `/maintenance/report?machineId=${scannedMachine.id}`;
        }
        break;
      case 'view-history':
        // TODO: Navigate to machine history page
        alert('ميزة سجل الماكينة قريباً!');
        break;
      case 'scan-another':
        setScannedMachine(null);
        setShowScanner(true);
        setError(null);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
    setError(null);
  };

  const handleCloseMachineDisplay = () => {
    setScannedMachine(null);
    setError(null);
  };

  const startScanning = () => {
    setShowScanner(true);
    setError(null);
    setScannedMachine(null);
  };

  const testCamera = async () => {
    try {
      console.log('Testing camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('Camera test successful!', stream);
      stream.getTracks().forEach(track => track.stop());
      alert('اختبار الكاميرا ناجح! الكاميرا تعمل.');
    } catch (err) {
      console.error('Camera test failed:', err);
      alert(`فشل اختبار الكاميرا: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
    }
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.SUPERVISOR, UserRole.MAINTENANCE_TECH, UserRole.MAINTENANCE_MANAGER, UserRole.ADMIN]}>
      <ClientOnly fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الماسح...</p>
          </div>
        </div>
      }>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto bg-white min-h-screen">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold text-center">ماسح رمز QR</h1>
              <p className="text-blue-100 text-center mt-2">
                امسح رموز QR الخاصة بالماكينات للوصول إلى المعلومات
              </p>
              {/* Mobile-specific instructions */}
              <div className="mt-4 text-sm text-blue-200">
                <p className="font-medium">تعليمات الهاتف المحمول:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• تأكد من السماح بإذن الكاميرا</li>
                  <li>• استخدم الكاميرا الخلفية للحصول على مسح أفضل</li>
                  <li>• أمسك الجهاز بثبات أثناء المسح</li>
                </ul>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
              {!showScanner && !scannedMachine && (
                <div className="text-center space-y-6">
                  {/* Scanner Icon */}
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">جاهز للمسح</h2>
                    <p className="text-gray-600">
                      اضغط على الزر أدناه لبدء مسح رموز QR على الماكينات.
                    </p>
                    <ul className="text-sm text-gray-500 space-y-1">
                      <li>• وجه الكاميرا نحو رمز QR</li>
                      <li>• تأكد من أن الرمز مضاء جيداً</li>
                      <li>• أمسك الجهاز بثبات حتى يكتمل المسح</li>
                    </ul>
                  </div>

                  {/* Start Scanning Button */}
                  <button
                    onClick={startScanning}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-medium text-lg flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    بدء المسح
                  </button>

              {/* Simulate Scan (manual input) */}
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">محاكاة المسح (أدخل رمز QR)</label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                    placeholder="الصق قيمة رمز QR أو UUID"
                    value={manualQr}
                    onChange={(e) => setManualQr(e.target.value)}
                  />
                  <button
                    onClick={() => manualQr.trim() && handleScanSuccess(manualQr.trim())}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md"
                  >
                    محاكاة المسح
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">للاختبارات التلقائية، يتنقل باستخدام قيمة QR المدخلة.</p>
              </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-red-800 font-medium">خطأ</span>
                    </div>
                    <p className="text-red-700 mt-1">{error}</p>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-800 text-sm mt-2 underline"
                    >
                      إغلاق
                    </button>
                  </div>
                )}

                {/* Mobile Troubleshooting */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-blue-800 font-medium mb-2">استكشاف أخطاء الهاتف المحمول</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>الكاميرا لا تعمل؟</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• تحقق من أذونات كاميرا المتصفح</li>
                      <li>• حاول تحديث الصفحة</li>
                      <li>• استخدم Chrome أو Safari للحصول على أفضل النتائج</li>
                      <li>• تأكد من أنك تستخدم HTTPS (مطلوب للكاميرا)</li>
                      <li>• حدّث متصفحك إلى أحدث إصدار</li>
                      <li>• حاول إعادة تشغيل المتصفح</li>
                      <li>• انقر فوق زر "اختبار الوصول إلى الكاميرا" أدناه</li>
                    </ul>
                  </div>
                </div>

                {/* HTTPS Warning */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-yellow-800 font-medium mb-2">ملاحظة مهمة</h3>
                  <div className="text-sm text-yellow-700">
                    <p><strong>الوصول إلى الكاميرا يتطلب HTTPS:</strong></p>
                    <p className="mt-1">إذا كنت تختبر محلياً، تأكد من استخدام <code className="bg-yellow-100 px-1 rounded">https://localhost</code> بدلاً من <code className="bg-yellow-100 px-1 rounded">http://localhost</code></p>
                  </div>
                </div>

                {/* Debug Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-gray-800 font-medium mb-2">معلومات التصحيح</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>البروتوكول:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'غير متاح'}</p>
                    <p><strong>المضيف:</strong> {typeof window !== 'undefined' ? window.location.host : 'غير متاح'}</p>
                    <p><strong>وكيل المستخدم:</strong> {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'غير متاح'}</p>
                    <p><strong>أجهزة الوسائط:</strong> {typeof navigator !== 'undefined' && navigator.mediaDevices ? 'متاح' : 'غير متاح'}</p>
                    <p><strong>GetUserMedia:</strong> {typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' ? 'متاح' : 'غير متاح'}</p>
                    <p><strong>سياق آمن:</strong> {typeof window !== 'undefined' ? (window.isSecureContext ? 'نعم' : 'لا') : 'غير متاح'}</p>
                  </div>
                  <button
                    onClick={testCamera}
                    className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
                  >
                    اختبار الوصول إلى الكاميرا
                  </button>
                </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">جاري تحميل معلومات الماكينة...</span>
                  </div>
                </div>
              )}
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onError={handleScanError}
                onClose={handleCloseScanner}
              />
            )}

            {/* Machine Display Modal */}
            {scannedMachine && (
              <MachineDisplay
                machine={scannedMachine}
                onAction={handleMachineAction}
                onClose={handleCloseMachineDisplay}
              />
            )}
          </div>
        </div>
      </ClientOnly>
    </ProtectedRoute>
  );
};

export default QRScannerPage;
