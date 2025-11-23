'use client';

import { useState } from 'react';
import { StockLevelsChart } from '@/components/charts/StockLevelsChart';
import { ConsumptionChart } from '@/components/charts/ConsumptionChart';
import { ValuationChart } from '@/components/charts/ValuationChart';
import { ReorderChart } from '@/components/charts/ReorderChart';
import { StockLevelsFilters, ConsumptionFilters, ValuationFilters, ReorderFilters } from '@/lib/api/reports';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';

type ReportTab = 'stock' | 'consumption' | 'valuation' | 'reorder';

export default function InventoryAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('stock');

  // Individual filters
  const [stockFilters, setStockFilters] = useState<StockLevelsFilters>({});
  const [consumptionFilters, setConsumptionFilters] = useState<ConsumptionFilters>({});
  const [valuationFilters, setValuationFilters] = useState<ValuationFilters>({});
  const [reorderFilters, setReorderFilters] = useState<ReorderFilters>({});

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">تحليلات وتقارير المخزون</h1>
          <p className="text-gray-600 mt-2">
            عرض تقارير المخزون الشاملة والتحليلات لتحسين مستويات المخزون وتقليل التكاليف
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('stock')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stock'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                مستويات المخزون
              </button>
              <button
                onClick={() => setActiveTab('consumption')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'consumption'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                الاستهلاك
              </button>
              <button
                onClick={() => setActiveTab('valuation')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'valuation'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                التقييم
              </button>
              <button
                onClick={() => setActiveTab('reorder')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reorder'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                إعادة الطلب
              </button>
            </nav>
          </div>
        </div>

        {/* Report Content */}
        <div>
          {activeTab === 'stock' && (
            <StockLevelsChart
              filters={stockFilters}
              onFiltersChange={setStockFilters}
            />
          )}
          {activeTab === 'consumption' && (
            <ConsumptionChart
              filters={consumptionFilters}
              onFiltersChange={setConsumptionFilters}
            />
          )}
          {activeTab === 'valuation' && (
            <ValuationChart
              filters={valuationFilters}
              onFiltersChange={setValuationFilters}
            />
          )}
          {activeTab === 'reorder' && (
            <ReorderChart
              filters={reorderFilters}
              onFiltersChange={setReorderFilters}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

