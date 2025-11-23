'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApprovedRequestsList } from '@/components/inventory/ApprovedRequestsList';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';

export default function ApprovedRequestsPage() {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const handleRequestSelect = (request: any) => {
    setSelectedRequest(request);
  };

  const handleRequestComplete = () => {
    setSelectedRequest(null);
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.INVENTORY_MANAGER, UserRole.ADMIN]}>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors touch-manipulation shadow-sm border border-gray-200"
              aria-label="رجوع"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-white md:text-gray-900">طلبات قطع الغيار</h1>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            مراجعة حالة طلبات قطع الغيار واتخاذ الإجراءات المناسبة
          </p>
        </div>

        <ApprovedRequestsList 
          onRequestSelect={handleRequestSelect}
          selectedRequest={selectedRequest}
          onComplete={handleRequestComplete}
        />
      </div>
    </ProtectedRoute>
  );
}
