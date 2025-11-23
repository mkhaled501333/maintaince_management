'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TechnicianDashboard } from '@/components/maintenance/TechnicianDashboard';
import { RequestDetailModal } from '@/components/maintenance/RequestDetailModal';
import { MaintenanceRequest, UserRole } from '@/lib/types';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';

export default function MaintenanceDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleRequestSelect = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
  };

  // Determine title and description based on user role
  const isManager = user?.role === UserRole.MAINTENANCE_MANAGER;
  const title = isManager ? 'لوحة تحكم مدير الصيانة' : 'لوحة تحكم الفني';
  const description = isManager 
    ? 'عرض الطلبات المتاحة وإدارة مهام العمل'
    : 'عرض الطلبات المتاحة وإدارة مهام العمل الخاصة بك';

  return (
    <ProtectedRoute requiredRoles={[UserRole.MAINTENANCE_TECH, UserRole.MAINTENANCE_MANAGER, UserRole.ADMIN]}>
      <div className="min-h-screen bg-white">
        {/* Sticky Header with Back Arrow */}
        <div className="sticky top-0 bg-blue-50 border-b border-blue-200 z-10">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-blue-100 text-blue-700 hover:text-blue-900 transition-colors touch-manipulation"
                aria-label="Go back"
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
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-blue-900">{title}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <TechnicianDashboard onRequestSelect={handleRequestSelect} />

          {selectedRequest && (
            <RequestDetailModal
              request={selectedRequest}
              isOpen={isDetailModalOpen}
              onClose={handleCloseDetail}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

