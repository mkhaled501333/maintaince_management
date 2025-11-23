'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { sparePartsApi } from '../../lib/api/spare-parts';
import { inventoryTransactionsApi } from '../../lib/api/inventory-transactions';
import { sparePartCategoriesApi } from '../../lib/api/spare-part-categories';
import { SparePart, SparePartCreate, SparePartUpdate, InventoryTransactionCreate, SparePartCategory } from '../../lib/types';

interface SparePartFormProps {
  sparePart?: SparePart;
  onSave: () => void;
  onCancel: () => void;
}

export function SparePartForm({ sparePart, onSave, onCancel }: SparePartFormProps) {
  const [formData, setFormData] = useState<SparePartCreate | SparePartUpdate>({
    partNumber: sparePart?.partNumber || '',
    partName: sparePart?.partName || '',
    description: sparePart?.description || '',
    categoryId: sparePart?.categoryId,
    currentStock: sparePart?.currentStock ?? 0,
    minimumStock: sparePart?.minimumStock ?? 0,
    maximumStock: sparePart?.maximumStock,
    unitPrice: sparePart?.unitPrice,
    supplier: sparePart?.supplier || '',
    supplierPartNumber: sparePart?.supplierPartNumber || '',
    location: sparePart?.location || '',
  });
  const [openingStock, setOpeningStock] = useState<string>(
    sparePart ? String(sparePart.currentStock ?? 0) : ''
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ['spare-part-categories', { isActive: true }],
    queryFn: () => sparePartCategoriesApi.getCategories({ isActive: true }),
  });

  const categories: SparePartCategory[] = useMemo(() => {
    const fetched = categoriesData ?? [];
    if (sparePart?.category) {
      const exists = fetched.some((category) => category.id === sparePart.category!.id);
      if (!exists) {
        return [...fetched, sparePart.category];
      }
    }
    return fetched;
  }, [categoriesData, sparePart?.category]);

  const createMutation = useMutation({
    mutationFn: async ({ data, openingQuantity }: { data: SparePartCreate; openingQuantity: number }) => {
      const createdPart = await sparePartsApi.createSparePart(data);
      if (openingQuantity > 0) {
        const transactionData: InventoryTransactionCreate = {
          sparePartId: createdPart.id,
          transactionType: 'IN',
          quantity: openingQuantity,
        };
        await inventoryTransactionsApi.createTransaction(transactionData);
      }
      return createdPart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-parts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      onSave();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SparePartUpdate }) =>
      sparePartsApi.updateSparePart(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-parts'] });
      onSave();
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.partNumber?.trim()) {
      newErrors.partNumber = 'رقم القطعة مطلوب';
    }
    if (!formData.partName?.trim()) {
      newErrors.partName = 'اسم القطعة مطلوب';
    }
    if (!formData.categoryId || formData.categoryId <= 0) {
      newErrors.categoryId = 'يجب اختيار فئة للقطعة';
    }
    if (!sparePart) {
      const openingValue = openingStock ? parseInt(openingStock, 10) : 0;
      if (Number.isNaN(openingValue) || openingValue < 0) {
        newErrors.openingStock = 'لا يمكن أن يكون الرصيد الافتتاحي سالبًا';
      }
    }
    if (!sparePart && openingStock && !/^\d+$/.test(openingStock)) {
      newErrors.openingStock = 'لا يمكن أن يكون الرصيد الافتتاحي سالبًا';
    }
    if (formData.minimumStock !== undefined && formData.minimumStock < 0) {
      newErrors.minimumStock = 'لا يمكن أن يكون الحد الأدنى سالبًا';
    }
    if (formData.maximumStock !== undefined && formData.maximumStock < 0) {
      newErrors.maximumStock = 'لا يمكن أن يكون الحد الأقصى سالبًا';
    }
    if (
      formData.maximumStock !== undefined &&
      formData.minimumStock !== undefined &&
      formData.maximumStock < formData.minimumStock
    ) {
      newErrors.maximumStock = 'يجب أن يكون الحد الأقصى أكبر من أو يساوي الحد الأدنى';
    }
    if (formData.unitPrice !== undefined && formData.unitPrice < 0) {
      newErrors.unitPrice = 'لا يمكن أن يكون سعر الوحدة سالبًا';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (sparePart) {
        // Update existing part
        await updateMutation.mutateAsync({
          id: sparePart.id,
          data: formData as SparePartUpdate,
        });
      } else {
        // Create new part
        const createPayload: SparePartCreate = {
          ...(formData as SparePartCreate),
          currentStock: 0,
        };
        await createMutation.mutateAsync({
          data: createPayload,
          openingQuantity: openingStock ? parseInt(openingStock, 10) || 0 : 0,
        });
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrors({ partNumber: 'يوجد بالفعل قطعة غيار بنفس الرقم' });
      } else {
        alert('فشل حفظ قطعة الغيار. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    let nextValue = value;
    if (field === 'categoryId') {
      nextValue = value ? parseInt(value, 10) || undefined : undefined;
    }
    setFormData({ ...formData, [field]: nextValue });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">
        {sparePart ? 'تعديل قطعة الغيار' : 'إضافة قطعة غيار جديدة'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Part Number */}
        <div>
          <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700">
            رقم القطعة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="partNumber"
            value={formData.partNumber || ''}
            onChange={(e) => handleChange('partNumber', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.partNumber ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            disabled={!!sparePart}
          />
          {errors.partNumber && <p className="mt-1 text-sm text-red-600">{errors.partNumber}</p>}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="partName" className="block text-sm font-medium text-gray-700">
            اسم القطعة <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="partName"
            value={formData.partName || ''}
            onChange={(e) => handleChange('partName', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.partName ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.partName && <p className="mt-1 text-sm text-red-600">{errors.partName}</p>}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            الوصف
          </label>
          <textarea
            id="description"
            rows={3}
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            الفئة <span className="text-red-500">*</span>
          </label>
          <select
            id="categoryId"
            value={formData.categoryId ?? ''}
            onChange={(e) => handleChange('categoryId', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.categoryId ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">اختر الفئة</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} {category.code ? `- ${category.code}` : ''}
              </option>
            ))}
          </select>
          {categoriesLoading && (
            <p className="mt-1 text-sm text-gray-600">جاري تحميل الفئات...</p>
          )}
          {categoriesError && (
            <p className="mt-1 text-sm text-red-600">تعذر تحميل الفئات. يرجى المحاولة لاحقًا.</p>
          )}
          {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            الموقع
          </label>
          <input
            type="text"
            id="location"
            value={formData.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Opening Stock */}
        {!sparePart && (
          <div>
            <label htmlFor="openingStock" className="block text-sm font-medium text-gray-700">
              الرصيد الافتتاحى
            </label>
            <input
              type="number"
              id="openingStock"
              min="0"
              value={openingStock}
              onChange={(e) => {
                setOpeningStock(e.target.value);
                if (errors.openingStock) {
                  setErrors({ ...errors, openingStock: '' });
                }
              }}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.openingStock ? 'border-red-300' : 'border-gray-300'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.openingStock && <p className="mt-1 text-sm text-red-600">{errors.openingStock}</p>}
          </div>
        )}

        {/* Minimum Stock */}
        <div>
          <label htmlFor="minimumStock" className="block text-sm font-medium text-gray-700">
            الحد الأدنى للمخزون <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="minimumStock"
            min="0"
            value={formData.minimumStock ?? ''}
            onChange={(e) => handleChange('minimumStock', parseInt(e.target.value) || 0)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.minimumStock ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.minimumStock && <p className="mt-1 text-sm text-red-600">{errors.minimumStock}</p>}
        </div>

        {/* Maximum Stock */}
        <div>
          <label htmlFor="maximumStock" className="block text-sm font-medium text-gray-700">
            الحد الأقصى للمخزون
          </label>
          <input
            type="number"
            id="maximumStock"
            min="0"
            value={formData.maximumStock ?? ''}
            onChange={(e) => handleChange('maximumStock', e.target.value ? parseInt(e.target.value) : undefined)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.maximumStock ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.maximumStock && <p className="mt-1 text-sm text-red-600">{errors.maximumStock}</p>}
        </div>

        {/* Unit Price */}
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
            سعر الوحدة
          </label>
          <input
            type="number"
            id="unitPrice"
            min="0"
            step="0.01"
            value={formData.unitPrice ?? ''}
            onChange={(e) => handleChange('unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.unitPrice ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>}
        </div>

        {/* Supplier */}
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
            المورد
          </label>
          <input
            type="text"
            id="supplier"
            value={formData.supplier || ''}
            onChange={(e) => handleChange('supplier', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Supplier Part Number */}
        <div>
          <label htmlFor="supplierPartNumber" className="block text-sm font-medium text-gray-700">
            رقم القطعة لدى المورد
          </label>
          <input
            type="text"
            id="supplierPartNumber"
            value={formData.supplierPartNumber || ''}
            onChange={(e) => handleChange('supplierPartNumber', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </form>
  );
}

