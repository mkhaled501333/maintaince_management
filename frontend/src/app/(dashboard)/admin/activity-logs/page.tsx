'use client';

import { ActivityLogsViewer } from '@/components/audit-log-viewer/ActivityLogsViewer';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';

export default function ActivityLogsPage() {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">سجلات النشاط</h1>
          <p className="mt-1 text-sm text-gray-500">
            عرض وتصدير سجلات نشاط النظام لأغراض المراجعة والامتثال
          </p>
        </div>

        <ActivityLogsViewer />
      </div>
    </ProtectedRoute>
  );
}

