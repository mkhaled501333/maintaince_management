'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { sparePartsApi } from '../../lib/api/spare-parts';
import { inventoryTransactionsApi } from '../../lib/api/inventory-transactions';
import { SparePart, SparePartFilters, StockStatus } from '../../lib/types';
type SparePartCategoryOption = {
  id: number;
  name: string;
  code?: string;
};
import { InventoryTransactionsList } from './InventoryTransactionsList';
import { exportToCSV } from './sparePartsUtils';
import styles from './SparePartsList.module.css';

interface SparePartsListProps {
  onEdit?: (part: SparePart) => void;
  onCreate?: () => void;
}

// Helper function to calculate stock status
function calculateStockStatus(currentStock: number, minimumStock: number, maximumStock?: number): StockStatus {
  if (currentStock < minimumStock) {
    return 'CRITICAL';
  } else if (currentStock < minimumStock * 1.5) {
    return 'LOW';
  } else if (maximumStock && currentStock > maximumStock) {
    return 'EXCESS';
  } else {
    return 'ADEQUATE';
  }
}

// Helper function to get stock status CSS class
function getStockStatusClass(status: StockStatus): string {
  switch (status) {
    case 'CRITICAL':
      return styles.statusCritical;
    case 'LOW':
      return styles.statusLow;
    case 'ADEQUATE':
      return styles.statusAdequate;
    case 'EXCESS':
      return styles.statusExcess;
    default:
      return styles.statusCell;
  }
}

// Helper function to get stock status in Arabic
function getStockStatusArabic(status: StockStatus): string {
  switch (status) {
    case 'CRITICAL':
      return 'حرج';
    case 'LOW':
      return 'منخفض';
    case 'ADEQUATE':
      return 'كافي';
    case 'EXCESS':
      return 'زائد';
    default:
      return status;
  }
}

export function SparePartsList({ onEdit, onCreate }: SparePartsListProps) {
  const [filters, setFilters] = useState<SparePartFilters>({
    page: 1,
    pageSize: 25,
    isActive: true,
    sortBy: 'partNumber',
    sortOrder: 'asc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [openFilterDropdown, setOpenFilterDropdown] = useState<'category' | 'stockStatus' | null>(null);
  const [pendingCategoryFilter, setPendingCategoryFilter] = useState<number[]>([]);
  const [pendingStockStatusFilter, setPendingStockStatusFilter] = useState<StockStatus[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [stockStatusSearchTerm, setStockStatusSearchTerm] = useState('');
  const [selectedPartForHistory, setSelectedPartForHistory] = useState<SparePart | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupplyDialogOpen, setIsSupplyDialogOpen] = useState(false);
  const [selectedPartForSupply, setSelectedPartForSupply] = useState<SparePart | null>(null);
  const [supplyQuantity, setSupplyQuantity] = useState<number>(1);
  const [supplyError, setSupplyError] = useState<string>('');
  const queryClient = useQueryClient();
  const router = useRouter();
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch spare parts with filters
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['spare-parts', filters],
    queryFn: () => sparePartsApi.getSpareParts(filters),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (partId: number) => sparePartsApi.deleteSparePart(partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-parts'] });
    },
  });

  const supplyMutation = useMutation({
    mutationFn: ({ sparePartId, quantity }: { sparePartId: number; quantity: number }) =>
      inventoryTransactionsApi.createTransaction({
        sparePartId,
        transactionType: 'IN',
        quantity,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-parts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['spare-part', variables.sparePartId] });
      closeSupplyDialog();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      alert(detail || 'فشل في حفظ الحركة. يرجى المحاولة مرة أخرى.');
    },
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search - only update filters after user stops typing for 500ms
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prevFilters) => ({ ...prevFilters, search: value || undefined, page: 1 }));
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);


  const handleApplyCategoryFilter = () => {
    setFilters({
      ...filters,
      categoryId: pendingCategoryFilter.length > 0 ? pendingCategoryFilter : undefined,
      page: 1,
    });
    setOpenFilterDropdown(null);
  };

  const handleClearCategoryFilter = () => {
    setPendingCategoryFilter([]);
    setFilters({ ...filters, categoryId: undefined, page: 1 });
    setOpenFilterDropdown(null);
  };

  const handleCategorySelection = (categoryId: number, checked: boolean) => {
    if (checked) {
      setPendingCategoryFilter([...pendingCategoryFilter, categoryId]);
    } else {
      setPendingCategoryFilter(pendingCategoryFilter.filter((c) => c !== categoryId));
    }
  };

  const handleSelectAllCategories = (checked: boolean, filteredCategories: SparePartCategoryOption[]) => {
    if (checked) {
      // Add all filtered categories that aren't already selected
      const newSelection = [...pendingCategoryFilter];
      filteredCategories.forEach((cat) => {
        if (!newSelection.includes(cat.id)) {
          newSelection.push(cat.id);
        }
      });
      setPendingCategoryFilter(newSelection);
    } else {
      // Remove only the filtered categories
      const filteredIds = filteredCategories.map((cat) => cat.id);
      setPendingCategoryFilter(pendingCategoryFilter.filter((catId) => !filteredIds.includes(catId)));
    }
  };

  const handleStockStatusFilter = (status: StockStatus | '') => {
    setFilters({ ...filters, stockStatus: status || undefined, page: 1 });
  };

  const handleApplyStockStatusFilter = () => {
    setFilters({ ...filters, stockStatus: pendingStockStatusFilter.length > 0 ? pendingStockStatusFilter : undefined, page: 1 });
    setOpenFilterDropdown(null);
  };

  const handleClearStockStatusFilter = () => {
    setPendingStockStatusFilter([]);
    setFilters({ ...filters, stockStatus: undefined, page: 1 });
    setOpenFilterDropdown(null);
  };

  const handleStockStatusSelection = (status: StockStatus, checked: boolean) => {
    if (checked) {
      setPendingStockStatusFilter([...pendingStockStatusFilter, status]);
    } else {
      setPendingStockStatusFilter(pendingStockStatusFilter.filter(s => s !== status));
    }
  };

  const handleSelectAllStockStatuses = (checked: boolean, filteredOptions: { value: string; label: string }[]) => {
    if (checked) {
      // Add all filtered options that aren't already selected
      const newSelection = [...pendingStockStatusFilter];
      filteredOptions.forEach(opt => {
        const status = opt.value as StockStatus;
        if (!newSelection.includes(status)) {
          newSelection.push(status);
        }
      });
      setPendingStockStatusFilter(newSelection);
    } else {
      // Remove only the filtered options
      const filteredValues = filteredOptions.map(opt => opt.value as StockStatus);
      setPendingStockStatusFilter(pendingStockStatusFilter.filter(status => !filteredValues.includes(status)));
    }
  };

  const handleSort = (field: 'partNumber' | 'partName' | 'currentStock' | 'categoryName') => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sortBy: field, sortOrder: newOrder });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleDelete = async (part: SparePart) => {
    if (window.confirm(`هل أنت متأكد من حذف قطعة الغيار "${part.partNumber}"؟`)) {
      try {
        await deleteMutation.mutateAsync(part.id);
      } catch (error) {
        alert('فشل حذف قطعة الغيار. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleViewHistory = (part: SparePart) => {
    setSelectedPartForHistory(part);
    setIsHistoryPanelOpen(true);
  };

  const openSupplyDialog = (part: SparePart) => {
    setSelectedPartForSupply(part);
    setSupplyQuantity(1);
    setSupplyError('');
    setIsSupplyDialogOpen(true);
  };

  const closeSupplyDialog = () => {
    setIsSupplyDialogOpen(false);
    setSelectedPartForSupply(null);
    setSupplyQuantity(1);
    setSupplyError('');
  };

  const handleSupplySave = async () => {
    if (!selectedPartForSupply) return;
    if (!supplyQuantity || supplyQuantity <= 0) {
      setSupplyError('الكمية يجب أن تكون أكبر من صفر');
      return;
    }
    try {
      await supplyMutation.mutateAsync({
        sparePartId: selectedPartForSupply.id,
        quantity: supplyQuantity,
      });
    } catch (error) {
      // Error handled in mutation onError
    }
  };

  const handleCloseHistoryPanel = () => {
    setIsHistoryPanelOpen(false);
    setSelectedPartForHistory(null);
  };

  // Row selection handlers (defined after data is available)
  const toggleSelectAll = (checked: boolean, parts: SparePart[]) => {
    if (checked) {
      const allIds = new Set(parts.map(part => part.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRowSelection = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
  };

  // Export to CSV
  const handleExportToCSV = () => {
    const dataToExport = spareParts.length > 0 ? spareParts : [];
    exportToCSV(dataToExport, `تصدير-قطع-الغيار-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setFilters({ ...filters, pageSize: newSize, page: 1 });
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setPendingCategoryFilter([]);
    setPendingStockStatusFilter([]);
    setFilters({
      page: 1,
      pageSize: filters.pageSize,
      isActive: true,
      sortBy: 'partNumber',
      sortOrder: 'asc',
    });
    setOpenFilterDropdown(null);
  };

  // Initialize pending values when opening dropdowns
  useEffect(() => {
    if (openFilterDropdown === 'category') {
      const categoryValue = filters.categoryId;
      setPendingCategoryFilter(
        Array.isArray(categoryValue)
          ? categoryValue
          : typeof categoryValue === 'number'
          ? [categoryValue]
          : []
      );
      setCategorySearchTerm('');
    } else if (openFilterDropdown === 'stockStatus') {
      const statusValue = filters.stockStatus;
      setPendingStockStatusFilter(
        Array.isArray(statusValue) ? statusValue : statusValue ? [statusValue] : []
      );
      setStockStatusSearchTerm('');
    }
  }, [openFilterDropdown, filters.categoryId, filters.stockStatus]);

  // Stock status options with Arabic labels
  const stockStatusOptions = [
    { value: 'CRITICAL', label: 'حرج' },
    { value: 'LOW', label: 'منخفض' },
    { value: 'ADEQUATE', label: 'كافي' },
    { value: 'EXCESS', label: 'زائد' },
  ];

  // Check if any filters are active
  const hasActiveFilters = !!(
    searchTerm || 
    (filters.categoryId &&
      (Array.isArray(filters.categoryId) ? filters.categoryId.length > 0 : typeof filters.categoryId === 'number')) ||
    (filters.stockStatus && (Array.isArray(filters.stockStatus) ? filters.stockStatus.length > 0 : true))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openFilterDropdown && !(event.target as Element).closest(`.${styles.filterDropdown}`) && 
          !(event.target as Element).closest(`.${styles.filterIcon}`)) {
        setOpenFilterDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilterDropdown]);

  // Always show header with button, even during loading/error states
  const renderHeader = () => (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-900">مخزون قطع الغيار</h2>
      {onCreate && (
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          إضافة قطعة غيار
        </button>
      )}
    </div>
  );

  // Only show full loading state on initial load (when there's no data yet)
  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    const errorDetails = (error as any)?.response?.data?.detail || errorMessage;
    
    return (
      <div className="space-y-6">
        {renderHeader()}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                حدث خطأ أثناء تحميل قطع الغيار
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{errorDetails}</p>
                <p className="mt-2">يرجى تحديث الصفحة أو التواصل مع الدعم إذا استمرت المشكلة.</p>
                {process.env.NODE_ENV === 'development' && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">معلومات التصحيح</summary>
                    <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const spareParts = data?.spareParts || [];
  const categoryOptionMap = new Map<number, SparePartCategoryOption>();
  spareParts.forEach((part) => {
    if (part.categoryId && part.category?.name) {
      categoryOptionMap.set(part.categoryId, {
        id: part.categoryId,
        name: part.category.name,
        code: part.category.code,
      });
    }
  });
  const categoryOptions = Array.from(categoryOptionMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'ar')
  );
  const activeCategoryFilterCount = Array.isArray(filters.categoryId)
    ? filters.categoryId.length
    : typeof filters.categoryId === 'number'
    ? 1
    : 0;
  const isAllSelected = spareParts.length > 0 && selectedRows.size === spareParts.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < spareParts.length;

  // Filter categories based on search term
  const filteredCategories = categoryOptions.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    (cat.code ? cat.code.toLowerCase().includes(categorySearchTerm.toLowerCase()) : false)
  );

  // Filter stock status options based on search term
  const filteredStockStatusOptions = stockStatusOptions.filter((option: { value: string; label: string }) =>
    option.label.toLowerCase().includes(stockStatusSearchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(stockStatusSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      {renderHeader()}

      {/* Table Container */}
      <div className={styles.excelContainer}>
        {/* Toolbar */}
        <div className={styles.excelToolbar}>
          <div className="relative" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="relative" style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="ابحث ب اسم القطعه"
                className="px-3 py-1.5 pr-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                style={{ width: '180px' }}
              />
              {searchTerm && !isFetching && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    handleSearchChange('');
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  title="مسح"
                >
                  ✕
                </button>
              )}
            </div>
            {isFetching && data && (
              <div className={styles.searchSpinner} title="جاري البحث...">
                <div className={styles.smallSpinner}></div>
              </div>
            )}
          </div>
          {selectedRows.size > 0 && (
            <button
              onClick={clearSelection}
              className={styles.toolbarButton}
            >
              إلغاء التحديد ({selectedRows.size})
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className={styles.toolbarButton}
            >
              مسح جميع الفلاتر
            </button>
          )}
          <button
            onClick={handleExportToCSV}
            className={styles.toolbarButton}
          >
            تصدير CSV
          </button>
          <button
            onClick={() => refetch()}
            className={styles.toolbarButton}
            disabled={isFetching}
          >
            تحديث
          </button>
        </div>

        {/* Table Wrapper */}
        <div className={styles.excelTableWrapper} ref={tableWrapperRef}>
          {/* Only show full overlay on initial load, not during search */}
          {isLoading && !data && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner}></div>
            </div>
          )}
          {/* Show subtle loading indicator during search/fetch */}
          {isFetching && data && (
            <div className={styles.fetchingIndicator}>
              <div className={styles.smallSpinner}></div>
            </div>
          )}
          <table className={styles.excelTable}>
            <thead className="bg-gradient-to-r from-slate-800 to-slate-700">
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => toggleSelectAll(e.target.checked, spareParts)}
                  />
                </th>
                <th
                  onClick={() => handleSort('partNumber')}
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span>رقم القطعة</span>
                    {filters.sortBy === 'partNumber' && (
                      <span style={{ color: '#fbbf24' }}>
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('partName')}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span>اسم القطعة</span>
                    {filters.sortBy === 'partName' && (
                      <span style={{ color: '#fbbf24' }}>
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span
                      onClick={() => handleSort('categoryName')}
                      style={{ cursor: 'pointer' }}
                    >
                      الفئة
                    </span>
                    {filters.sortBy === 'categoryName' && (
                      <span style={{ color: '#fbbf24' }}>
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                    <span
                      className={`${styles.filterIcon} ${activeCategoryFilterCount ? styles.active : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFilterDropdown(openFilterDropdown === 'category' ? null : 'category');
                      }}
                      title="تصفية"
                    >
                      🔽
                      {activeCategoryFilterCount > 0 && (
                        <span className={styles.filterCount}>
                          {activeCategoryFilterCount}
                        </span>
                      )}
                    </span>
                  </div>
                  {openFilterDropdown === 'category' && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenFilterDropdown(null)}
                        style={{ zIndex: 999 }}
                      ></div>
                      <div className={styles.filterDropdown} style={{ zIndex: 1000 }}>
                        <div className={styles.filterHeader}>
                          <strong>الفئة</strong>
                          <button
                            onClick={() => setOpenFilterDropdown(null)}
                            title="إغلاق"
                          >
                            ×
                          </button>
                        </div>
                        <div className={styles.searchableSelectFilter}>
                          <div className={styles.searchContainer}>
                            <input
                              type="text"
                              placeholder="البحث في الفئات..."
                              value={categorySearchTerm}
                              onChange={(e) => setCategorySearchTerm(e.target.value)}
                              className={styles.searchInput}
                              autoFocus
                            />
                            {categorySearchTerm && (
                              <button
                                className={styles.clearSearchButton}
                                onClick={() => setCategorySearchTerm('')}
                                title="مسح البحث"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <div className={styles.filterOptions}>
                            {filteredCategories.length === 0 ? (
                              <div className={styles.noSearchResults}>
                                لا توجد نتائج لـ "{categorySearchTerm}"
                              </div>
                            ) : (
                              <>
                                <div className={styles.filterOption}>
                                  <input
                                    type="checkbox"
                                    checked={
                                      filteredCategories.length > 0 &&
                                      filteredCategories.every((cat) => pendingCategoryFilter.includes(cat.id))
                                    }
                                    ref={(input) => {
                                      if (input) {
                                        const allSelected =
                                          filteredCategories.length > 0 &&
                                          filteredCategories.every((cat) =>
                                            pendingCategoryFilter.includes(cat.id)
                                          );
                                        const someSelected = filteredCategories.some((cat) =>
                                          pendingCategoryFilter.includes(cat.id)
                                        );
                                        input.indeterminate = someSelected && !allSelected;
                                      }
                                    }}
                                    onChange={(e) => handleSelectAllCategories(e.target.checked, filteredCategories)}
                                  />
                                  <label>تحديد الكل ({filteredCategories.length})</label>
                                </div>
                                {filteredCategories.map((cat) => {
                                  const isChecked = pendingCategoryFilter.includes(cat.id);
                                  return (
                                    <div
                                      key={cat.id}
                                      className={styles.filterOption}
                                      onClick={() => handleCategorySelection(cat.id, !isChecked)}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => handleCategorySelection(cat.id, e.target.checked)}
                                      />
                                      <label>
                                        {cat.name}
                                        {cat.code ? ` (${cat.code})` : ''}
                                      </label>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                          <div className={styles.filterActions}>
                            <button
                              className={styles.clearButton}
                              onClick={handleClearCategoryFilter}
                            >
                              مسح
                            </button>
                            <button
                              className={styles.applyButton}
                              onClick={handleApplyCategoryFilter}
                            >
                              تطبيق
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </th>
                <th>رقم الفئة</th>
                <th>الموقع</th>
                <th
                  onClick={() => handleSort('currentStock')}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span>المخزون</span>
                    {filters.sortBy === 'currentStock' && (
                      <span style={{ color: '#fbbf24' }}>
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th>الحد الأدنى/الأقصى</th>
                <th style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    <span>الحالة</span>
                    <span
                      className={`${styles.filterIcon} ${filters.stockStatus ? styles.active : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenFilterDropdown(openFilterDropdown === 'stockStatus' ? null : 'stockStatus');
                      }}
                      title="تصفية"
                    >
                      🔽
                      {filters.stockStatus && (
                        <span className={styles.filterCount}>
                          {Array.isArray(filters.stockStatus) ? filters.stockStatus.length : 1}
                        </span>
                      )}
                    </span>
                  </div>
                  {openFilterDropdown === 'stockStatus' && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenFilterDropdown(null)}
                        style={{ zIndex: 999 }}
                      ></div>
                      <div className={styles.filterDropdown} style={{ zIndex: 1000 }}>
                        <div className={styles.filterHeader}>
                          <strong>حالة المخزون</strong>
                          <button
                            onClick={() => setOpenFilterDropdown(null)}
                            title="إغلاق"
                          >
                            ×
                          </button>
                        </div>
                        <div className={styles.searchableSelectFilter}>
                          <div className={styles.searchContainer}>
                            <input
                              type="text"
                              placeholder="البحث في الحالات..."
                              value={stockStatusSearchTerm}
                              onChange={(e) => setStockStatusSearchTerm(e.target.value)}
                              className={styles.searchInput}
                              autoFocus
                            />
                            {stockStatusSearchTerm && (
                              <button
                                className={styles.clearSearchButton}
                                onClick={() => setStockStatusSearchTerm('')}
                                title="مسح البحث"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <div className={styles.filterOptions}>
                            {filteredStockStatusOptions.length === 0 ? (
                              <div className={styles.noSearchResults}>
                                لا توجد نتائج لـ "{stockStatusSearchTerm}"
                              </div>
                            ) : (
                              <>
                                <div className={styles.filterOption}>
                                  <input
                                    type="checkbox"
                                    checked={
                                      filteredStockStatusOptions.length > 0 &&
                                      filteredStockStatusOptions.every(opt => pendingStockStatusFilter.includes(opt.value as StockStatus))
                                    }
                                    ref={(input) => {
                                      if (input) {
                                        const allSelected = filteredStockStatusOptions.length > 0 &&
                                          filteredStockStatusOptions.every(opt => pendingStockStatusFilter.includes(opt.value as StockStatus));
                                        const someSelected = filteredStockStatusOptions.some(opt => pendingStockStatusFilter.includes(opt.value as StockStatus));
                                        input.indeterminate = someSelected && !allSelected;
                                      }
                                    }}
                                    onChange={(e) => handleSelectAllStockStatuses(e.target.checked, filteredStockStatusOptions)}
                                  />
                                  <label>تحديد الكل ({filteredStockStatusOptions.length})</label>
                                </div>
                                {filteredStockStatusOptions.map(option => (
                                  <div
                                    key={option.value}
                                    className={styles.filterOption}
                                    onClick={() => handleStockStatusSelection(option.value as StockStatus, !pendingStockStatusFilter.includes(option.value as StockStatus))}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={pendingStockStatusFilter.includes(option.value as StockStatus)}
                                      onChange={(e) => handleStockStatusSelection(option.value as StockStatus, e.target.checked)}
                                    />
                                    <label>{option.label}</label>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                          <div className={styles.filterActions}>
                            <button
                              className={styles.clearButton}
                              onClick={handleClearStockStatusFilter}
                            >
                              مسح
                            </button>
                            <button
                              className={styles.applyButton}
                              onClick={handleApplyStockStatusFilter}
                            >
                              تطبيق
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </th>
                <th style={{ width: '90px', minWidth: '90px', textAlign: 'center' }}>عدد الحركات</th>
                <th style={{ width: 'clamp(240px, 22vw, 320px)', minWidth: '240px', textAlign: 'center' }}>
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {spareParts.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '48px', color: '#6c757d' }}>
                    لا توجد قطع غيار
                  </td>
                </tr>
              ) : (
                spareParts.map((part) => {
                  const stockStatus = calculateStockStatus(part.currentStock, part.minimumStock, part.maximumStock);
                  const isSelected = selectedRows.has(part.id);
                  return (
                    <tr 
                      key={part.id}
                      className={isSelected ? styles.selected : ''}
                    >
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleRowSelection(part.id, e.target.checked)}
                        />
                      </td>
                      <td>
                        {part.partNumber}
                      </td>
                      <td>{part.partName}</td>
                      <td>{part.category?.name || <span style={{ color: '#adb5bd' }}>-</span>}</td>
                      <td>{part.category?.code || <span style={{ color: '#adb5bd' }}>-</span>}</td>
                      <td>{part.location || <span style={{ color: '#adb5bd' }}>-</span>}</td>
                      <td style={{ fontWeight: 'bold', fontSize: '16px' }}>{part.currentStock}</td>
                      <td>
                        <span style={{ fontWeight: '500' }}>{part.minimumStock}</span> /{' '}
                        <span style={{ color: '#6c757d' }}>{part.maximumStock || '-'}</span>
                      </td>
                      <td>
                        <span className={`${styles.statusCell} ${getStockStatusClass(stockStatus)}`}>
                          {getStockStatusArabic(stockStatus)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', width: '90px', minWidth: '90px' }}>
                        {part.transactionCount ?? 0}
                      </td>
                      <td style={{ width: 'clamp(240px, 22vw, 320px)', minWidth: '240px', textAlign: 'center' }}>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleViewHistory(part)}
                            className={`${styles.actionButton} ${styles.actionButtonHistory}`}
                            title="عرض سجل الحركات"
                          >
                            الحركات
                          </button>
                          <button
                            onClick={() => openSupplyDialog(part)}
                            className={`${styles.actionButton} ${styles.actionButtonSupply}`}
                            disabled={supplyMutation.isPending && selectedPartForSupply?.id === part.id}
                          >
                            توريد
                          </button>
                          <button
                            onClick={() => onEdit?.(part)}
                            className={`${styles.actionButton} ${styles.actionButtonEdit}`}
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(part)}
                            className={`${styles.actionButton} ${styles.actionButtonDelete}`}
                            disabled={deleteMutation.isPending}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 0 && (
          <div className={styles.excelFooter}>
            <div>
              <span style={{ marginLeft: '10px' }}>
                عرض {((data.page - 1) * data.pageSize) + 1} إلى{' '}
                {Math.min(data.page * data.pageSize, data.total)} من {data.total} نتيجة
              </span>
              <div className={styles.pageSizeSelector} style={{ marginTop: '8px', marginRight: '10px' }}>
                <label>عدد الصفوف:</label>
                <select
                  value={filters.pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => handlePageChange(1)}
                disabled={data.page === 1 || isFetching}
                className={styles.paginationBtn}
              >
                الأولى
              </button>
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1 || isFetching}
                className={styles.paginationBtn}
              >
                السابق
              </button>
              <span style={{ padding: '0 12px' }}>
                صفحة {data.page} من {data.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages || isFetching}
                className={styles.paginationBtn}
              >
                التالي
              </button>
              <button
                onClick={() => handlePageChange(data.totalPages)}
                disabled={data.page === data.totalPages || isFetching}
                className={styles.paginationBtn}
              >
                الأخيرة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Side Panel */}
      {isHistoryPanelOpen && selectedPartForHistory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={handleCloseHistoryPanel}
          ></div>
          
          {/* Side Panel */}
          <div className="fixed left-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col">
            {/* Panel Header */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 px-6 py-5 border-b border-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCloseHistoryPanel}
                  className="p-2 text-white/70 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all"
                  title="إغلاق"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div>
                  <h3 className="text-xl font-bold text-white">سجل المعاملات</h3>
                  <p className="text-sm text-white/80 mt-1">
                    {selectedPartForHistory.partNumber} - {selectedPartForHistory.partName}
                  </p>
                </div>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <InventoryTransactionsList sparePartId={selectedPartForHistory.id} />
            </div>
          </div>
        </>
      )}

      {/* Supply Dialog */}
      {isSupplyDialogOpen && selectedPartForSupply && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={closeSupplyDialog}
          ></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">توريد كمية</h3>
                <button
                  onClick={closeSupplyDialog}
                  className="p-2 text-white/70 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all"
                  title="إغلاق"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{selectedPartForSupply.partNumber}</span> - {selectedPartForSupply.partName}
                </div>
                <div>
                  <label htmlFor="supplyQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                    الكمية
                  </label>
                  <input
                    id="supplyQuantity"
                    type="number"
                    min="1"
                    value={supplyQuantity.toString()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setSupplyQuantity(Number.isNaN(value) ? 0 : value);
                      if (supplyError) setSupplyError('');
                    }}
                    className={`block w-full px-3 py-2 border ${
                      supplyError ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {supplyError && <p className="mt-1 text-sm text-red-600">{supplyError}</p>}
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeSupplyDialog}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={supplyMutation.isPending}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSupplySave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={supplyMutation.isPending}
                >
                  {supplyMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

