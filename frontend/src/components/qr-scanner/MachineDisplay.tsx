'use client';

import React from 'react';
import { Machine, MachineStatus } from '@/lib/types';
import { machineStatusLabels, formatDateArabic } from '@/lib/locale';

interface MachineDisplayProps {
  machine: Machine;
  onAction: (action: string) => void;
  onClose?: () => void;
}

const MachineDisplay: React.FC<MachineDisplayProps> = ({ machine, onAction, onClose }) => {
  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
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

  const getStatusIcon = (status: MachineStatus) => {
    switch (status) {
      case MachineStatus.OPERATIONAL:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case MachineStatus.DOWN:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case MachineStatus.MAINTENANCE:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        );
      case MachineStatus.DECOMMISSIONED:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
        <h2 className="text-white text-lg font-semibold">معلومات الماكينة</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 p-2"
          aria-label="إغلاق"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Machine Information */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Machine Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <h3 className="text-xl font-bold mb-2">{machine.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(machine.status)}`}>
                {getStatusIcon(machine.status)}
                {machineStatusLabels[machine.status]}
              </span>
            </div>
          </div>

          {/* Machine Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">الطراز</label>
                <p className="text-gray-900">{machine.model || 'غير متاح'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">الرقم التسلسلي</label>
                <p className="text-gray-900">{machine.serialNumber || 'غير متاح'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">القسم</label>
              <p className="text-gray-900">{machine.department?.name || 'غير متاح'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                الموقع
              </label>
              <p className="text-gray-900 font-medium">{machine.location || 'غير متاح'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">تاريخ التركيب</label>
              <p className="text-gray-900">{formatDateArabic(machine.installationDate)}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">تاريخ الإنشاء</label>
                <p className="text-gray-900">{formatDateArabic(machine.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">آخر تحديث</label>
                <p className="text-gray-900">{formatDateArabic(machine.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-black bg-opacity-50">
        <div className="max-w-md mx-auto space-y-3">
          <button
            onClick={() => onAction('report-problem')}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            الإبلاغ عن مشكلة
          </button>
          
          <a
            href={`/machines/${machine.id}`}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            عرض التفاصيل الكاملة
          </a>
          
          <button
            onClick={() => onAction('scan-another')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            مسح أخرى
          </button>
        </div>
      </div>
    </div>
  );
};

export default MachineDisplay;
