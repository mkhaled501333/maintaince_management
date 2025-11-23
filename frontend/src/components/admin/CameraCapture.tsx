'use client';

import React, { useRef, useState, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onError, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('الملف المحدد ليس صورة. يرجى اختيار صورة.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('حجم الصورة كبير جداً. الحد الأقصى هو 10 ميجابايت.');
      return;
    }

    // Store the file
    setCapturedFile(file);

    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setCapturedImage(imageUrl);
  }, [onError]);

  const handleCaptureClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const retakePhoto = useCallback(() => {
    // Clean up captured image URL
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [capturedImage]);

  const confirmUpload = useCallback(() => {
    if (!capturedFile) {
      onError('لا توجد صورة للرفع');
      return;
    }

    onCapture(capturedFile);
  }, [capturedFile, onCapture, onError]);

  const handleClose = useCallback(() => {
    // Clean up captured image URL
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    if (onClose) {
      onClose();
    }
  }, [capturedImage, onClose]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-3 bg-black bg-opacity-80">
        <h2 className="text-white text-lg font-semibold">التقاط صورة الماكينة</h2>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-300 p-2"
          aria-label="إغلاق"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!capturedImage ? (
          <>
            <div className="text-center mb-8">
              <svg className="w-32 h-32 mx-auto text-white mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-white text-lg mb-2">اضغط على الزر لفتح الكاميرا</p>
              <p className="text-gray-400 text-sm">سيتم فتح تطبيق الكاميرا على هاتفك</p>
            </div>
            <button
              onClick={handleCaptureClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              فتح الكاميرا
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={retakePhoto}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                إعادة التقاط
              </button>
              <button
                onClick={confirmUpload}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                رفع الصورة
              </button>
            </div>
            <div className="relative w-full max-w-2xl">
              <img
                src={capturedImage}
                alt="Captured machine photo"
                className="w-full h-auto rounded-lg border-2 border-white"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;

