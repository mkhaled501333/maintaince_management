import { SparePart } from '../../lib/types';

// Export to CSV utility
export function exportToCSV(data: SparePart[], filename: string = 'spare-parts-export.csv') {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Define CSV headers in Arabic
  const headers = [
    'رقم القطعة',
    'اسم القطعة',
    'الفئة',
    'رقم الفئة',
    'الموقع',
    'المخزون',
    'الحد الأدنى',
    'الحد الأقصى',
    'الحالة',
    'الوصف',
    'المورد',
    'رقم قطعة المورد',
    'سعر الوحدة',
  ];

  // Convert data to CSV rows
  const rows = data.map((part) => {
    const stockStatus = calculateStockStatus(part.currentStock, part.minimumStock, part.maximumStock);
    const statusArabic = getStockStatusArabic(stockStatus);
    
    return [
      part.partNumber || '',
      part.partName || '',
      part.category?.name || '',
      part.category?.code || '',
      part.location || '',
      part.currentStock.toString(),
      part.minimumStock.toString(),
      part.maximumStock?.toString() || '',
      statusArabic,
      part.description || '',
      part.supplier || '',
      part.supplierPartNumber || '',
      part.unitPrice?.toString() || '',
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // Add BOM for UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper function to calculate stock status
function calculateStockStatus(currentStock: number, minimumStock: number, maximumStock?: number): 'CRITICAL' | 'LOW' | 'ADEQUATE' | 'EXCESS' {
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

// Helper function to get stock status in Arabic
function getStockStatusArabic(status: 'CRITICAL' | 'LOW' | 'ADEQUATE' | 'EXCESS'): string {
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

