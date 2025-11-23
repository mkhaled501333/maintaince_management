'use client';

import { useState } from 'react';
import { DowntimeReportChart } from '@/components/charts/DowntimeReportChart';
import { MaintenanceCostChart } from '@/components/charts/MaintenanceCostChart';
import { FailureAnalysisChart } from '@/components/charts/FailureAnalysisChart';
import { DowntimeReportFilters, MaintenanceCostReportFilters, FailureAnalysisReportFilters } from '@/lib/api/reports';

type ReportTab = 'downtime' | 'cost' | 'failure';

export default function MaintenanceAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('downtime');

  // Global filters
  const [globalStartDate, setGlobalStartDate] = useState<string>('');
  const [globalEndDate, setGlobalEndDate] = useState<string>('');

  // Individual filters
  const [downtimeFilters, setDowntimeFilters] = useState<DowntimeReportFilters>({});
  const [costFilters, setCostFilters] = useState<MaintenanceCostReportFilters>({});
  const [failureFilters, setFailureFilters] = useState<FailureAnalysisReportFilters>({});

  const handleApplyGlobalFilters = () => {
    // Apply global filters to all report types
    setDowntimeFilters({
      ...downtimeFilters,
      startDate: globalStartDate,
      endDate: globalEndDate,
    });
    setCostFilters({
      ...costFilters,
      startDate: globalStartDate,
      endDate: globalEndDate,
    });
    setFailureFilters({
      ...failureFilters,
      startDate: globalStartDate,
      endDate: globalEndDate,
    });
  };

  const handleClearFilters = () => {
    setGlobalStartDate('');
    setGlobalEndDate('');
    setDowntimeFilters({});
    setCostFilters({});
    setFailureFilters({});
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">تحليلات وتقارير الصيانة</h1>
        <p className="text-gray-600 mt-2">
          عرض التحليلات والتقارير حول أداء الصيانة لاتخاذ قرارات مبنية على البيانات
        </p>
      </div>

      {/* Global Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">الفلاتر العامة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={globalStartDate}
              onChange={(e) => setGlobalStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ النهاية
            </label>
            <input
              type="date"
              value={globalEndDate}
              onChange={(e) => setGlobalEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyGlobalFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              تطبيق الفلاتر
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              مسح
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('downtime')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'downtime'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              تقارير وقت التوقف
            </button>
            <button
              onClick={() => setActiveTab('cost')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cost'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              تكاليف الصيانة
            </button>
            <button
              onClick={() => setActiveTab('failure')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'failure'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              تحليل الأعطال
            </button>
          </nav>
        </div>
      </div>

      {/* Report Content */}
      <div>
        {activeTab === 'downtime' && (
          <DowntimeReportChart
            filters={downtimeFilters}
            onFiltersChange={setDowntimeFilters}
          />
        )}
        {activeTab === 'cost' && (
          <MaintenanceCostChart
            filters={costFilters}
            onFiltersChange={setCostFilters}
          />
        )}
        {activeTab === 'failure' && (
          <FailureAnalysisChart
            filters={failureFilters}
            onFiltersChange={setFailureFilters}
          />
        )}
      </div>
    </div>
  );
}

