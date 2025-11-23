'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, DowntimeReportFilters } from '../../lib/api/reports';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DowntimeReportChartProps {
  filters: DowntimeReportFilters;
  onFiltersChange: (filters: DowntimeReportFilters) => void;
}

export function DowntimeReportChart({ filters, onFiltersChange }: DowntimeReportChartProps) {
  const [chartType, setChartType] = useState<'machine' | 'department' | 'trend'>('machine');

  // Fetch downtime report data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['downtime-report', filters],
    queryFn: async () => {
      const result = await reportsApi.getDowntimeReport(filters);
      // Check if result is a Blob (export case)
      if (result instanceof Blob) {
        throw new Error('Unexpected Blob response');
      }
      return result;
    },
  });

  const handleExport = async () => {
    try {
      const exportData = await reportsApi.getDowntimeReport({ ...filters, export: 'csv' });
      if (exportData instanceof Blob) {
        reportsApi.downloadExport(exportData, `downtime_report_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h3 className="text-sm font-medium text-red-800">Error loading downtime report</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load downtime data. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">No downtime data available for the selected filters.</p>
      </div>
    );
  }

  // Get data for current chart type
  const chartData = chartType === 'machine' 
    ? data.byMachine.map(item => ({
        name: item.machineName,
        'Total Downtime (Hours)': item.totalDowntime,
        'Average Downtime (Hours)': item.avgDowntime,
        frequency: item.frequency,
      }))
    : chartType === 'department'
    ? data.byDepartment.map(item => ({
        name: item.departmentName || 'Unknown',
        'Total Downtime (Hours)': item.totalDowntime,
        'Average Downtime (Hours)': item.avgDowntime,
        frequency: item.frequency,
      }))
    : []; // Trend chart would need time series data

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Downtime</div>
          <div className="text-2xl font-bold text-blue-600">{data.totalDowntimeHours.toFixed(2)} hrs</div>
          <div className="text-xs text-gray-500">{data.totalDowntimeMinutes.toFixed(0)} min</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Average Downtime</div>
          <div className="text-2xl font-bold text-green-600">{data.avgDowntimeHours.toFixed(2)} hrs</div>
          <div className="text-xs text-gray-500">{data.avgDowntimeMinutes.toFixed(0)} min</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Incidents</div>
          <div className="text-2xl font-bold text-purple-600">{data.frequency}</div>
          <div className="text-xs text-gray-500">Events</div>
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
            onClick={() => setChartType('department')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'department'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Department
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
          {chartType === 'machine' ? 'Downtime by Machine' : 'Downtime by Department'}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Total Downtime (Hours)" fill="#3b82f6" />
            <Bar dataKey="Average Downtime (Hours)" fill="#10b981" />
          </BarChart>
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
                  {chartType === 'machine' ? 'Machine' : 'Department'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Downtime (Hours)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Downtime (Hours)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item['Total Downtime (Hours)'].toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item['Average Downtime (Hours)'].toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.frequency}
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

