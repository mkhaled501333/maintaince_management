'use client';

import { useState } from 'react';
import { InventoryTransactionsList } from '@/components/inventory/InventoryTransactionsList';
import { InventoryTransactionForm } from '@/components/inventory/InventoryTransactionForm';
import { InventoryTransaction, UserRole } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function InventoryTransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<InventoryTransaction | null>(null);

  const handleCreate = () => {
    setSelectedTransaction(null);
    setShowForm(true);
  };

  const handleView = (transaction: InventoryTransaction) => {
    setSelectedTransaction(transaction);
    setShowForm(false);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setSelectedTransaction(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedTransaction(null);
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INVENTORY_MANAGER]}>
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">معاملات المخزون</h1>
        <p className="mt-1 text-sm text-gray-500">
          عرض وإدارة جميع معاملات المخزون بما في ذلك حركات المخزون والتعديلات
        </p>
      </div>

      {showForm ? (
        <div className="mb-6">
          <InventoryTransactionForm onSave={handleFormSave} onCancel={handleFormCancel} />
        </div>
      ) : (
        <InventoryTransactionsList onCreate={handleCreate} onView={handleView} />
      )}

      {selectedTransaction && !showForm && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل المعاملة</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">رقم المعاملة</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedTransaction.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">نوع المعاملة</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedTransaction.transactionType}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">قطعة الغيار</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedTransaction.sparePartNumber} - {selectedTransaction.sparePartName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">الكمية</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedTransaction.quantity}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">سعر الوحدة</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedTransaction.unitPrice
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      selectedTransaction.unitPrice
                    )
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">القيمة الإجمالية</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedTransaction.totalValue
                  ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      selectedTransaction.totalValue
                    )
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">تغيير المخزون</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedTransaction.beforeQuantity !== undefined &&
                selectedTransaction.afterQuantity !== undefined
                  ? `${selectedTransaction.beforeQuantity} → ${selectedTransaction.afterQuantity}`
                  : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">تم بواسطة</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedTransaction.performedByName || '-'}
              </dd>
            </div>
            {selectedTransaction.notes && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">ملاحظات</dt>
                <dd className="mt-1 text-sm text-gray-900">{selectedTransaction.notes}</dd>
              </div>
            )}
          </dl>
          <button
            onClick={() => setSelectedTransaction(null)}
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}

