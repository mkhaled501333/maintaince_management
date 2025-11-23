'use client';

import { useQuery } from '@tanstack/react-query';
import { sparePartsApi } from '../../lib/api/spare-parts';
import Link from 'next/link';

interface LowStockAlertsProps {
  limit?: number;
}

// Helper function to get stock status color
function getStockStatusColor(status: 'CRITICAL' | 'LOW'): string {
  switch (status) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'LOW':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

export function LowStockAlerts({ limit = 10 }: LowStockAlertsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['low-stock-parts', { page: 1, pageSize: limit }],
    queryFn: () => sparePartsApi.getLowStockParts({ page: 1, pageSize: limit }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Alerts</h3>
        <div className="text-sm text-red-600">Error loading low stock alerts</div>
      </div>
    );
  }

  const lowStockParts = data?.spareParts || [];
  const criticalCount = lowStockParts.filter(
    p => p.currentStock < p.minimumStock
  ).length;
  const lowCount = lowStockParts.filter(
    p => p.currentStock >= p.minimumStock && p.currentStock < p.minimumStock * 1.5
  ).length;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
        <Link
          href="/inventory/spare-parts?stockStatus=CRITICAL"
          className="text-sm text-blue-600 hover:text-blue-900"
        >
          View All
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-800">{criticalCount}</div>
          <div className="text-sm text-red-600">Critical</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-800">{lowCount}</div>
          <div className="text-sm text-orange-600">Low</div>
        </div>
      </div>

      {/* List */}
      {lowStockParts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No low stock items</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockParts.map((part) => {
            const isCritical = part.currentStock < part.minimumStock;
            const status = isCritical ? 'CRITICAL' : 'LOW';
            return (
              <div
                key={part.id}
                className={`border rounded-lg p-4 ${getStockStatusColor(status)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{part.partNumber}</div>
                    <div className="text-sm opacity-90">{part.partName}</div>
                    <div className="text-sm mt-1">
                      Stock: {part.currentStock} / Min: {part.minimumStock}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

