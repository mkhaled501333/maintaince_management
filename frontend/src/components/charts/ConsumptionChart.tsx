'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, ConsumptionFilters } from '../../lib/api/reports';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ConsumptionChartProps {
  filters: ConsumptionFilters;
  onFiltersChange: (filters: ConsumptionFilters) => void;
}

export function ConsumptionChart({ filters, onFiltersChange }: ConsumptionChartProps) {
  // Fetch consumption report data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['consumption-report', filters],
    queryFn: async () => {
      const result = await reportsApi.getInventoryConsumption(filters);
      // Check if result is a Blob (export case)
      if (result instanceof Blob) {
        throw new Error('Unexpected Blob response');
      }
      return result;
    },
  });

  const handleExport = async () => {
    try {
      const exportData = await reportsApi.getInventoryConsumption({ ...filters, export: 'csv' });
      if (exportData instanceof Blob) {
        reportsApi.downloadExport(exportData, `consumption_report_${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading consumption report</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load consumption data. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">No consumption data available for the selected filters.</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.byPart.map(item => ({
    name: item.partNumber,
    'Quantity Consumed': item.quantityConsumed,
    'Total Value': item.totalValue,
  }));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Consumption</div>
          <div className="text-2xl font-bold text-blue-600">{data.totalConsumption}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Transaction Count</div>
          <div className="text-2xl font-bold text-green-600">{data.transactionCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Date Range</div>
          <div className="text-sm font-semibold text-gray-700">
            {filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString() : 'All'} - 
            {filters.dateTo ? new Date(filters.dateTo).toLocaleDateString() : 'All'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Consumption by Part</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Quantity Consumed" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Consumed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.byPart.map((item) => (
                <tr key={item.partId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.partNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.partName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.categoryName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantityConsumed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.totalValue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

