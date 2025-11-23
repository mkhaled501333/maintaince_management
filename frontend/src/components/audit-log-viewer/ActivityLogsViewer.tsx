'use client';

import { useState, Fragment } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { activityLogsApi, ActivityLog, ActivityLogFilters } from '../../lib/api/activity-logs';
import { useQueryClient } from '@tanstack/react-query';

interface ActivityLogsViewerProps {
  // Optional props for customization
}

export function ActivityLogsViewer({}: ActivityLogsViewerProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>({
    page: 1,
    pageSize: 25,
  });
  
  // Filter state
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const queryClient = useQueryClient();

  // Fetch activity logs
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => activityLogsApi.getActivityLogs(filters),
  });

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: (exportFilters: ActivityLogFilters) => activityLogsApi.exportActivityLogs(exportFilters),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      setFilters({ ...filters, search: value || undefined, page: 1 });
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      userId: userId || undefined,
      action: actionFilter || undefined,
      entityType: entityTypeFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setUserId(undefined);
    setActionFilter('');
    setEntityTypeFilter('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setFilters({
      page: 1,
      pageSize: 25,
    });
  };

  const handleExport = () => {
    const exportFilters: ActivityLogFilters = {
      userId: userId || undefined,
      action: actionFilter || undefined,
      entityType: entityTypeFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: searchTerm || undefined,
    };
    exportMutation.mutate(exportFilters);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseJsonValues = (jsonString?: string) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return jsonString;
    }
  };

  const toggleRowExpansion = (logId: number) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Failed to load activity logs. Please try again.</p>
      </div>
    );
  }

  const logs = data?.activityLogs || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.page || 1;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Export Button */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search description..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* User ID Filter */}
          <div>
            <input
              type="number"
              placeholder="User ID"
              value={userId || ''}
              onChange={(e) => setUserId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Action Filter */}
          <div>
            <input
              type="text"
              placeholder="Action (e.g., CREATE, UPDATE)"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Entity Type Filter */}
          <div>
            <input
              type="text"
              placeholder="Entity Type"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date Range */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No activity logs found
                </td>
              </tr>
            ) : (
              logs.map((log: ActivityLog) => {
                const oldValues = parseJsonValues(log.oldValues);
                const newValues = parseJsonValues(log.newValues);
                const hasDetails = oldValues || newValues || log.userAgent;

                return (
                  <Fragment key={log.id}>
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => hasDetails && toggleRowExpansion(log.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.userFullName || log.userName || `User ${log.userId}`}</div>
                          {log.userName && log.userName !== log.userFullName && (
                            <div className="text-gray-500 text-xs">{log.userName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{log.entityType}</div>
                          <div className="text-gray-500 text-xs">ID: {log.entityId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={log.description || ''}>
                          {log.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hasDetails && (
                          <span className="text-blue-600 hover:text-blue-800">
                            {expandedRow === log.id ? 'Hide' : 'Show'}
                          </span>
                        )}
                      </td>
                    </tr>
                    {expandedRow === log.id && hasDetails && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="space-y-3">
                            {log.userAgent && (
                              <div>
                                <span className="font-medium text-sm text-gray-700">User Agent:</span>
                                <div className="text-sm text-gray-600 mt-1">{log.userAgent}</div>
                              </div>
                            )}
                            {oldValues && (
                              <div>
                                <span className="font-medium text-sm text-gray-700">Old Values:</span>
                                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(oldValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            {newValues && (
                              <div>
                                <span className="font-medium text-sm text-gray-700">New Values:</span>
                                <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages} ({data?.total || 0} total logs)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

