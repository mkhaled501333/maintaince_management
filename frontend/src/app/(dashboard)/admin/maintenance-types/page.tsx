'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';
import MaintenanceTypesSection from '@/components/admin/master-data/MaintenanceTypesSection';

export default function MaintenanceTypesAdminPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MaintenanceTypesSection />
        </div>
      </div>
    </ProtectedRoute>
  );
}


