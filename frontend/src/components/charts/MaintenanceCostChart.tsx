'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, MaintenanceCostReportFilters, MaintenanceCostReportResponse } from '../../lib/api/reports';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface MaintenanceCostChartProps {
  filters: MaintenanceCostReportFilters;
  onFiltersChange: (filters: MaintenanceCostReportFilters) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function MaintenanceCostChart({ filters, onFiltersChange }: MaintenanceCostChartProps) {
  const [chartType, setChartType] = useState<'machine' | 'type' | 'breakdown'>('machine');

  // Fetch maintenance cost report data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance-cost-report', filters],
    queryFn: () => reportsApi.getMaintenanceCostReport(filters),
  });

  const handleExport = async () => {
    try {
      const exportData = await reportsApi.getMaintenanceCostReport({ ...filters, export: 'csv' }) as Blob;
      reportsApi.downloadExport(exportData, `maintenance_costs_report_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h3 className="text-sm font-medium text-red-800">Error loading cost report</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load cost data. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">No cost data available for the selected filters.</p>
      </div>
    );
  }

  // Type guard: check if data is a Blob (export) or MaintenanceCostReportResponse
  if (data instanceof Blob) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">Unexpected data format received.</p>
      </div>
    );
  }

  // At this point, TypeScript knows data is MaintenanceCostReportResponse
  const reportData = data as MaintenanceCostReportResponse;

  // Prepare data for different chart types
  const machineData = reportData.byMachine.map(item => ({
    name: item.machineName,
    'Parts Cost': item.partsCost,
    'Labor Cost': item.laborCost,
    'Total Cost': item.totalCost,
    count: item.maintenanceCount,
  }));

  const typeData = reportData.byMaintenanceType.map((item, index) => ({
    name: item.maintenanceTypeName,
    value: item.totalCost,
    partsCost: item.partsCost,
    laborCost: item.laborCost,
    count: item.maintenanceCount,
  }));

  const breakdownData = [
    {
      name: 'Parts',
      cost: reportData.totalPartsCost,
      percentage: reportData.totalCost > 0 ? (reportData.totalPartsCost / reportData.totalCost * 100) : 0,
    },
    {
      name: 'Labor',
      cost: reportData.totalLaborCost,
      percentage: reportData.totalCost > 0 ? (reportData.totalLaborCost / reportData.totalCost * 100) : 0,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Parts Cost</div>
          <div className="text-2xl font-bold text-blue-600">${reportData.totalPartsCost.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Labor Cost</div>
          <div className="text-2xl font-bold text-green-600">${reportData.totalLaborCost.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Cost</div>
          <div className="text-2xl font-bold text-purple-600">${reportData.totalCost.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Data Range</div>
          <div className="text-sm font-semibold text-gray-700">
            {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'All'} - 
            {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'All'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('machine')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'machine'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Machine
          </button>
          <button
            onClick={() => setChartType('type')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'type'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Type
          </button>
          <button
            onClick={() => setChartType('breakdown')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'breakdown'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Breakdown
          </button>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
        >
          Export CSV
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          {chartType === 'machine' ? 'Costs by Machine' : 
           chartType === 'type' ? 'Costs by Maintenance Type' : 
           'Cost Breakdown'}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'machine' ? (
            <BarChart data={machineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
              <Legend />
              <Bar dataKey="Parts Cost" fill="#3b82f6" />
              <Bar dataKey="Labor Cost" fill="#10b981" />
            </BarChart>
          ) : chartType === 'type' ? (
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }: any) => `${name}: ${(percentage as number).toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
            </PieChart>
          ) : (
            <BarChart data={breakdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${typeof value === 'number' ? value.toFixed(2) : value}`} />
              <Legend />
              <Bar dataKey="cost" fill="#8b5cf6" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Detailed Data</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {chartType === 'machine' ? 'Machine' : 'Maintenance Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parts Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Labor Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(chartType === 'machine' ? reportData.byMachine : reportData.byMaintenanceType).map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {'machineName' in item ? item.machineName : item.maintenanceTypeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.partsCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${item.laborCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ${item.totalCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.maintenanceCount}
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

