'use client';

import React from 'react';
import { MachineSparePartInfo } from '@/lib/types';

interface SparePartsRequirementsProps {
  requirements: MachineSparePartInfo[];
}

const SparePartsRequirements: React.FC<SparePartsRequirementsProps> = ({ requirements }) => {
  const getStockStatusBadge = (stockStatus?: string) => {
    switch (stockStatus) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            متوفر
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            مخزون منخفض
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            نفاد المخزون
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            غير معروف
          </span>
        );
    }
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return 'غير متاح';
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'USD' }).format(price);
  };

  if (requirements.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">متطلبات قطع الغيار</h2>
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="mt-2">لا توجد متطلبات قطع غيار محددة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">متطلبات قطع الغيار</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                رقم القطعة
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم القطعة
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                الكمية المطلوبة
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                المخزون الحالي
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                سعر الوحدة
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ملاحظات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requirements.map((requirement) => (
              <tr key={requirement.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {requirement.sparePart.partNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {requirement.sparePart.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {requirement.quantityRequired}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span
                    className={
                      requirement.sparePart.currentStock < requirement.quantityRequired
                        ? 'text-red-600 font-medium'
                        : 'text-green-600'
                    }
                  >
                    {requirement.sparePart.currentStock}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getStockStatusBadge(requirement.stockStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(requirement.sparePart.unitPrice)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {requirement.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SparePartsRequirements;

