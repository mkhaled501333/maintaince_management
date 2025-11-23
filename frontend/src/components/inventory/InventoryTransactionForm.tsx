'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { inventoryTransactionsApi } from '../../lib/api/inventory-transactions';
import { sparePartsApi } from '../../lib/api/spare-parts';
import { InventoryTransactionCreate, TransactionType, ReferenceType, SparePart } from '../../lib/types';

interface InventoryTransactionFormProps {
  onSave: () => void;
  onCancel: () => void;
  initialSparePartId?: number;
}

export function InventoryTransactionForm({ onSave, onCancel, initialSparePartId }: InventoryTransactionFormProps) {
  const [formData, setFormData] = useState<InventoryTransactionCreate>({
    sparePartId: initialSparePartId || 0,
    transactionType: 'IN',
    quantity: 1,
    unitPrice: undefined,
    referenceType: undefined,
    referenceNumber: '',
    notes: '',
    transactionDate: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  // Fetch spare parts for dropdown
  const { data: sparePartsData, isLoading: sparePartsLoading, error: sparePartsError, refetch: refetchSpareParts } = useQuery({
    queryKey: ['spare-parts', { isActive: true }],
    queryFn: () => sparePartsApi.getSpareParts({ isActive: true, page: 1, pageSize: 100 }),
  });

  // Fetch selected spare part details for stock display
  const { data: selectedSparePart } = useQuery({
    queryKey: ['spare-part', formData.sparePartId],
    queryFn: () => sparePartsApi.getSparePart(formData.sparePartId),
    enabled: formData.sparePartId > 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: InventoryTransactionCreate) => inventoryTransactionsApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-part', formData.sparePartId] });
      setHasChanges(false);
      onSave();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Failed to create transaction. Please try again.';
      if (message.includes('Insufficient stock')) {
        setErrors({ quantity: message });
      } else {
        alert(message);
      }
    },
  });

  // Calculate total value
  const totalValue = formData.unitPrice && formData.quantity
    ? formData.unitPrice * formData.quantity
    : undefined;

  // Check if OUT transaction has sufficient stock
  const insufficientStock = formData.transactionType === 'OUT' &&
    selectedSparePart &&
    selectedSparePart.currentStock < formData.quantity;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sparePartId || formData.sparePartId <= 0) {
      newErrors.sparePartId = 'Spare part is required';
    }
    if (!formData.transactionType) {
      newErrors.transactionType = 'Transaction type is required';
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (formData.unitPrice !== undefined && formData.unitPrice < 0) {
      newErrors.unitPrice = 'Unit price cannot be negative';
    }
    if (insufficientStock) {
      newErrors.quantity = `Insufficient stock. Current: ${selectedSparePart?.currentStock}, Requested: ${formData.quantity}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const submitData = {
        ...formData,
        unitPrice: formData.unitPrice || undefined,
        referenceType: formData.referenceType || undefined,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
        transactionDate: formData.transactionDate || undefined,
      };
      await createMutation.mutateAsync(submitData);
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  const handleChange = (field: keyof InventoryTransactionCreate, value: any) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">Create Inventory Transaction</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spare Part */}
        <div>
          <label htmlFor="sparePartId" className="block text-sm font-medium text-gray-700">
            Spare Part <span className="text-red-500">*</span>
          </label>
          <select
            id="sparePartId"
            value={formData.sparePartId || ''}
            onChange={(e) => handleChange('sparePartId', parseInt(e.target.value))}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.sparePartId ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            disabled={sparePartsLoading || !!sparePartsError}
          >
            <option value="">Select a spare part</option>
            {sparePartsData?.spareParts.map((part: SparePart) => (
              <option key={part.id} value={part.id}>
                {part.partNumber} - {part.partName} (Stock: {part.currentStock})
              </option>
            ))}
          </select>
          {sparePartsLoading && (
            <p className="mt-1 text-sm text-gray-600">Loading spare parts…</p>
          )}
          {sparePartsError && (
            <div className="mt-1 text-sm text-red-600">
              Failed to load spare parts. <button type="button" onClick={() => refetchSpareParts()} className="underline">Retry</button>
            </div>
          )}
          {!sparePartsLoading && !sparePartsError && (sparePartsData?.spareParts?.length ?? 0) === 0 && (
            <p className="mt-1 text-sm text-gray-600">No spare parts found. Please add parts first.</p>
          )}
          {errors.sparePartId && <p className="mt-1 text-sm text-red-600">{errors.sparePartId}</p>}
          {selectedSparePart && (
            <p className="mt-1 text-sm text-gray-600">
              Current Stock: <span className="font-semibold">{selectedSparePart.currentStock}</span> units
            </p>
          )}
        </div>

        {/* Transaction Type */}
        <div>
          <label htmlFor="transactionType" className="block text-sm font-medium text-gray-700">
            Transaction Type <span className="text-red-500">*</span>
          </label>
          <select
            id="transactionType"
            value={formData.transactionType}
            onChange={(e) => handleChange('transactionType', e.target.value as TransactionType)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.transactionType ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="IN">IN - Stock Received</option>
            <option value="OUT">OUT - Stock Issued</option>
            <option value="ADJUSTMENT">ADJUSTMENT - Stock Adjustment</option>
            <option value="TRANSFER">TRANSFER - Stock Transfer</option>
          </select>
          {errors.transactionType && <p className="mt-1 text-sm text-red-600">{errors.transactionType}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            value={formData.quantity || ''}
            onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.quantity ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
          {insufficientStock && (
            <p className="mt-1 text-sm text-orange-600 font-semibold">
              Warning: Insufficient stock available!
            </p>
          )}
        </div>

        {/* Unit Price */}
        <div>
          <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
            Unit Price
          </label>
          <input
            type="number"
            id="unitPrice"
            min="0"
            step="0.01"
            value={formData.unitPrice || ''}
            onChange={(e) => handleChange('unitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.unitPrice ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.unitPrice && <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>}
          {totalValue !== undefined && (
            <p className="mt-1 text-sm text-gray-600">
              Total Value: <span className="font-semibold">{totalValue.toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* Reference Type */}
        <div>
          <label htmlFor="referenceType" className="block text-sm font-medium text-gray-700">
            Reference Type
          </label>
          <select
            id="referenceType"
            value={formData.referenceType || ''}
            onChange={(e) => handleChange('referenceType', e.target.value || undefined)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">None</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="TRANSFER">TRANSFER</option>
          </select>
        </div>

        {/* Reference Number */}
        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700">
            Reference Number
          </label>
          <input
            type="text"
            id="referenceNumber"
            maxLength={100}
            value={formData.referenceNumber || ''}
            onChange={(e) => handleChange('referenceNumber', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Transaction Date */}
        <div>
          <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
            Transaction Date
          </label>
          <input
            type="datetime-local"
            id="transactionDate"
            value={formData.transactionDate || ''}
            onChange={(e) => handleChange('transactionDate', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        {hasChanges && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Transaction'}
          </button>
        )}
      </div>
    </form>
  );
}

