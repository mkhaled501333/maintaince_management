'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { inventoryTransactionsApi } from '../../lib/api/inventory-transactions';
import { InventoryTransaction, InventoryTransactionFilters, TransactionType, ReferenceType } from '../../lib/types';

interface InventoryTransactionsListProps {
  onView?: (transaction: InventoryTransaction) => void;
  onCreate?: () => void;
  sparePartId?: number;
}

// Helper function to get transaction type color
function getTransactionTypeColor(type: TransactionType): string {
  switch (type) {
    case 'IN':
      return 'bg-green-100 text-green-800';
    case 'OUT':
      return 'bg-red-100 text-red-800';
    case 'ADJUSTMENT':
      return 'bg-blue-100 text-blue-800';
    case 'TRANSFER':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get transaction type in Arabic
function getTransactionTypeArabic(type: TransactionType): string {
  switch (type) {
    case 'IN':
      return 'دخول';
    case 'OUT':
      return 'خروج';
    case 'ADJUSTMENT':
      return 'تعديل';
    case 'TRANSFER':
      return 'نقل';
    default:
      return type;
  }
}

export function InventoryTransactionsList({ onView, onCreate, sparePartId }: InventoryTransactionsListProps) {
  const searchParams = useSearchParams();
  const urlSparePartId = searchParams?.get('sparePartId');
  const effectiveSparePartId = sparePartId || (urlSparePartId ? parseInt(urlSparePartId) : undefined);

  const [filters, setFilters] = useState<InventoryTransactionFilters>({
    page: 1,
    pageSize: 25,
    sparePartId: effectiveSparePartId,
    sortBy: 'transactionDate',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | ''>('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Update filters when URL param changes
  useEffect(() => {
    if (effectiveSparePartId) {
      setFilters((prev) => ({ ...prev, sparePartId: effectiveSparePartId, page: 1 }));
    }
  }, [effectiveSparePartId]);

  // Fetch transactions with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-transactions', filters],
    queryFn: () => inventoryTransactionsApi.getTransactions(filters),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const timeoutId = setTimeout(() => {
      setFilters({ ...filters, search: value || undefined, page: 1 });
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleTransactionTypeFilter = (type: TransactionType | '') => {
    setTransactionTypeFilter(type);
    setFilters({ ...filters, transactionType: type || undefined, page: 1 });
  };

  const handleDateFilter = () => {
    setFilters({
      ...filters,
      dateFrom: dateFromFilter || undefined,
      dateTo: dateToFilter || undefined,
      page: 1,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTransactionTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setFilters({
      page: 1,
      pageSize: 25,
      sparePartId: sparePartId,
      sortBy: 'transactionDate',
      sortOrder: 'desc',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">جاري تحميل المعاملات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center py-12">
          <p className="text-red-600">خطأ في تحميل المعاملات. يرجى المحاولة مرة أخرى.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">معاملات المخزون</h2>
          {onCreate && (
            <button
              onClick={onCreate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              معاملة جديدة
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="البحث في المرجع أو الملاحظات..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
            />
          </div>

          {/* Transaction Type Filter */}
          <div>
            <select
              value={transactionTypeFilter}
              onChange={(e) => handleTransactionTypeFilter(e.target.value as TransactionType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
            >
              <option value="">جميع الأنواع</option>
              <option value="IN">دخول</option>
              <option value="OUT">خروج</option>
              <option value="ADJUSTMENT">تعديل</option>
              <option value="TRANSFER">نقل</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <input
              type="date"
              placeholder="من تاريخ"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
            />
          </div>

          {/* Date To */}
          <div className="flex gap-2">
            <input
              type="date"
              placeholder="إلى تاريخ"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-right"
            />
            <button
              onClick={handleDateFilter}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              تصفية
            </button>
            {(dateFromFilter || dateToFilter || transactionTypeFilter || searchTerm) && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-slate-800 to-slate-700">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-bold text-white tracking-wider border-l border-slate-600/30">
                رقم المعاملة
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-white tracking-wider border-l border-slate-600/30">
                نوع المعاملة
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-white tracking-wider border-l border-slate-600/30">
                قطعة الغيار
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-white tracking-wider border-l border-slate-600/30">
                الكمية
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-white tracking-wider border-l border-slate-600/30">
                تغيير المخزون
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-white tracking-wider border-l border-slate-600/30">
                تم بواسطة
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-white tracking-wider border-l border-slate-600/30">
                ملاحظات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  لا توجد معاملات
                </td>
              </tr>
            ) : (
              data?.transactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  }`}
                  onClick={() => onView && onView(transaction)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-lg shadow-sm border-2 ${getTransactionTypeColor(
                        transaction.transactionType
                      )} border-opacity-30`}
                    >
                      {getTransactionTypeArabic(transaction.transactionType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    <div>
                      <div className="font-medium">{transaction.sparePartNumber || '-'}</div>
                      <div className="text-gray-500 text-xs">{transaction.sparePartName || '-'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    {transaction.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {transaction.beforeQuantity !== undefined && transaction.afterQuantity !== undefined ? (
                      <div>
                        <span className="text-gray-500">{transaction.beforeQuantity ?? 'null'}</span>
                        <span className="mx-1">→</span>
                        <span className="font-semibold">{transaction.afterQuantity ?? 'null'}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                    {transaction.performedByName || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right max-w-xs">
                    <div className="truncate" title={transaction.notes || ''}>
                      {transaction.notes || <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            عرض {(filters.page! - 1) * filters.pageSize! + 1} إلى{' '}
            {Math.min(filters.page! * filters.pageSize!, data.total)} من {data.total} نتيجة
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
              disabled={filters.page === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700">
              صفحة {filters.page} من {data.totalPages}
            </span>
            <button
              onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
              disabled={filters.page === data.totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

