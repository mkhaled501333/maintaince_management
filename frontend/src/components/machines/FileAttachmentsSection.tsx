'use client';

import React, { useState } from 'react';
import { AttachmentBasicInfo } from '@/lib/types';
import { getApiBaseUrl } from '@/lib/api-config';
import { formatDateArabic } from '@/lib/locale';
import { attachmentsApi } from '@/lib/api/attachments';
import FileUploadSection from '../attachments/FileUploadSection';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { AuthenticatedImage } from '../attachments/AuthenticatedImage';

interface FileAttachmentsSectionProps {
  machineId: number;
  attachments: AttachmentBasicInfo[];
  onAttachmentAdded?: () => void;
}

const FileAttachmentsSection: React.FC<FileAttachmentsSectionProps> = ({ machineId, attachments, onAttachmentAdded }) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<AttachmentBasicInfo | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<Record<number, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = Math.round((bytes / Math.pow(k, i)) * 100) / 100;
    return `${new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(value)} ${sizes[i]}`;
  };

  const typeLabels: Record<string, string> = {
    image: 'ملفات الصور',
    application: 'ملفات التطبيقات',
    text: 'ملفات نصية',
    video: 'ملفات فيديو',
    audio: 'ملفات صوتية',
    default: 'ملفات أخرى',
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  const groupByType = (attachments: AttachmentBasicInfo[]) => {
    const grouped: Record<string, AttachmentBasicInfo[]> = {};
    attachments.forEach((att) => {
      const type = att.mimeType.split('/')[0];
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(att);
    });
    return grouped;
  };

  if (attachments.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">الملفات المرفقة</h2>
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2">لا توجد مرفقات متاحة</p>
        </div>
      </div>
    );
  }

  const groupedAttachments = groupByType(attachments);

  const canUpload = user?.role === UserRole.ADMIN || user?.role === UserRole.MAINTENANCE_MANAGER || user?.role === UserRole.SUPERVISOR;

  const handleUpload = async () => {
    if (pendingFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const description = fileDescriptions[i] || '';
        await attachmentsApi.upload({
          entityType: 'MACHINE',
          entityId: machineId,
          file,
          description: description || undefined,
        });
      }
      setPendingFiles([]);
      setFileDescriptions({});
      if (onAttachmentAdded) {
        onAttachmentAdded();
      }
    } catch (err: any) {
      console.error('Error uploading files:', err);
      alert('فشل رفع الملفات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">الملفات المرفقة ({attachments.length})</h2>
        {canUpload && (
          <div className="flex items-center gap-2">
            <FileUploadSection onFilesUploaded={setPendingFiles} />
            {pendingFiles.length > 0 && (
              <div className="flex items-center gap-2">
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded text-xs">
                    <input
                      type="text"
                      placeholder="وصف (اختياري)"
                      value={fileDescriptions[index] || ''}
                      onChange={(e) => setFileDescriptions({ ...fileDescriptions, [index]: e.target.value })}
                      className="px-2 py-1 text-xs text-gray-900 border border-gray-300 rounded w-32 placeholder:text-gray-400"
                    />
                    <span className="text-gray-600 truncate max-w-[100px]">{file.name}</span>
                  </div>
                ))}
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isUploading ? 'جاري الرفع...' : 'رفع'}
                </button>
                <button
                  onClick={() => {
                    setPendingFiles([]);
                    setFileDescriptions({});
                  }}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {Object.entries(groupedAttachments).map(([type, files]) => (
        <div key={type} className="mb-6 last:mb-0">
          <h3 className="text-sm font-medium text-gray-700 mb-3 capitalize">
            {typeLabels[type] || typeLabels.default}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-start">
                  {getFileIcon(file.mimeType)}
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.originalFileName}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.fileSize)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateArabic(file.uploadedAt, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {file.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{file.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* File Preview Modal */}
      {selectedFile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFile(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">{selectedFile.originalFileName}</h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">حجم الملف</dt>
                    <dd className="text-sm text-gray-900">{formatFileSize(selectedFile.fileSize)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">النوع</dt>
                    <dd className="text-sm text-gray-900">{selectedFile.mimeType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">تاريخ الرفع</dt>
                    <dd className="text-sm text-gray-900">
                      {formatDateArabic(selectedFile.uploadedAt, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                  {selectedFile.description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">الوصف</dt>
                      <dd className="text-sm text-gray-900">{selectedFile.description}</dd>
                    </div>
                  )}
                </dl>
              </div>
              {selectedFile.mimeType.startsWith('image/') && (
                <div className="mt-4">
                  <AuthenticatedImage
                    attachmentId={selectedFile.id}
                    alt={selectedFile.originalFileName}
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <a
                  href={`${getApiBaseUrl()}/attachments/${selectedFile.id}/file`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                >
                  تحميل الملف
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileAttachmentsSection;

