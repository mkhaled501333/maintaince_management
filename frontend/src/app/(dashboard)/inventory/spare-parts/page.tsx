'use client';

import { useState } from 'react';
import { SparePartsList } from '@/components/inventory/SparePartsList';
import { SparePartForm } from '@/components/inventory/SparePartForm';
import { SparePart } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';

export default function SparePartsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | undefined>();

  const handleCreate = () => {
    setEditingPart(undefined);
    setShowForm(true);
  };

  const handleEdit = (part: SparePart) => {
    setEditingPart(part);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPart(undefined);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingPart(undefined);
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.INVENTORY_MANAGER, UserRole.ADMIN]}>
      <div className="p-6">
        <SparePartsList
          onEdit={handleEdit}
          onCreate={handleCreate}
        />
        
        {/* Modal for Add/Edit Form */}
        {showForm && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={handleCancel}
            ></div>
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 px-6 py-4 border-b border-slate-600 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {editingPart ? 'تعديل قطعة الغيار' : 'إضافة قطعة غيار جديدة'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="p-2 text-white/70 hover:text-white hover:bg-slate-600/50 rounded-lg transition-all"
                    title="إغلاق"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <SparePartForm
                    sparePart={editingPart}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

