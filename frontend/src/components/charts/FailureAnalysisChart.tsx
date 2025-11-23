'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, FailureAnalysisReportFilters, FailureAnalysisReportResponse } from '../../lib/api/reports';
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

interface FailureAnalysisChartProps {
  filters: FailureAnalysisReportFilters;
  onFiltersChange: (filters: FailureAnalysisReportFilters) => void;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function FailureAnalysisChart({ filters, onFiltersChange }: FailureAnalysisChartProps) {
  const [chartType, setChartType] = useState<'frequency' | 'category' | 'trend'>('frequency');

  // Fetch failure analysis report data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['failure-analysis-report', filters],
    queryFn: () => reportsApi.getFailureAnalysisReport(filters),
  });

  const handleExport = async () => {
    try {
      const exportData = await reportsApi.getFailureAnalysisReport({ ...filters, export: 'csv' }) as Blob;
      reportsApi.downloadExport(exportData, `failure_analysis_report_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h3 className="text-sm font-medium text-red-800">Error loading failure analysis</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Failed to load failure data. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">No failure data available for the selected filters.</p>
      </div>
    );
  }

  // Type guard: check if data is a Blob (export) or FailureAnalysisReportResponse
  if (data instanceof Blob) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600">Unexpected data format received.</p>
      </div>
    );
  }

  // At this point, TypeScript knows data is FailureAnalysisReportResponse
  const reportData = data as FailureAnalysisReportResponse;

  // Get top 10 failures for charts
  const topFailures = reportData.failurePatterns.slice(0, 10);

  const frequencyData = topFailures.map(item => ({
    name: item.failureCode,
    frequency: item.frequency,
    resolutionTime: item.avgResolutionTimeMinutes,
    affectedMachines: item.affectedMachineCount,
  }));

  // Group by category
  const categoryMap = new Map<string, number>();
  reportData.failurePatterns.forEach(item => {
    const category = item.failureCategory || 'UNKNOWN';
    categoryMap.set(category, (categoryMap.get(category) || 0) + item.frequency);
  });
  
  const categoryData = Array.from(categoryMap.entries()).map(([category, count]) => ({
    name: category,
    value: count,
  }));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Total Failures</div>
          <div className="text-2xl font-bold text-red-600">{reportData.totalFailures}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Unique Failure Codes</div>
          <div className="text-2xl font-bold text-blue-600">{reportData.uniqueFailureCodes}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Recurring Issues</div>
          <div className="text-2xl font-bold text-orange-600">{reportData.recurringIssues.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">Data Range</div>
          <div className="text-sm font-semibold text-gray-700">
            {filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'All'} - 
            {filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'All'}
          </div>
        </div>
      </div>

      {/* Recurring Issues Alert */}
      {reportData.recurringIssues.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">Recurring Issues Detected</h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>The following {reportData.recurringIssues.length} failure codes have been identified as recurring issues:</p>
                <ul className="list-disc list-inside mt-1">
                  {reportData.recurringIssues.slice(0, 3).map(issue => (
                    <li key={issue.failureCodeId}>
                      <span className="font-semibold">{issue.failureCode}</span>: {issue.frequency} occurrences
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('frequency')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'frequency'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Frequency
          </button>
          <button
            onClick={() => setChartType('category')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              chartType === 'category'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            By Category
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
          {chartType === 'frequency' ? 'Failure Frequency by Code (Top 10)' : 'Failures by Category'}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'frequency' ? (
            <BarChart data={frequencyData}>
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
              <Bar dataKey="frequency" fill="#ef4444" name="Frequency" />
              <Bar dataKey="affectedMachines" fill="#3b82f6" name="Affected Machines" />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }: any) => `${name}: ${(percentage as number).toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Failure Patterns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Failure Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Resolution (min)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affected Machines
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.failurePatterns.map((pattern) => (
                <tr 
                  key={pattern.failureCodeId}
                  className={reportData.recurringIssues.some(r => r.failureCodeId === pattern.failureCodeId) 
                    ? 'bg-orange-50' 
                    : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{pattern.failureCode}</span>
                    {reportData.recurringIssues.some(r => r.failureCodeId === pattern.failureCodeId) && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                        Recurring
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pattern.failureDescription.substring(0, 50)}
                    {pattern.failureDescription.length > 50 ? '...' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pattern.failureCategory || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {pattern.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pattern.avgResolutionTimeMinutes.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pattern.affectedMachineCount}
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

