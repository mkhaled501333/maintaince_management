'use client';

import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MachineStatus, UserRole } from '@/lib/types';
import { maintenanceRequestApi } from '@/lib/api/maintenance-requests';
import { machineApi } from '@/lib/api/machines';

export default function AdminHomePage() {
  const {
    data: activeFaultsCount,
    isLoading: isActiveFaultsLoading,
    isError: isActiveFaultsError,
  } = useQuery({
    queryKey: ['admin-home', 'active-faults'],
    queryFn: maintenanceRequestApi.getActiveFaultsCount,
    refetchInterval: 30000,
  });

  const {
    data: stoppedMachinesCount,
    isLoading: isStoppedMachinesLoading,
    isError: isStoppedMachinesError,
  } = useQuery({
    queryKey: ['admin-home', 'stopped-machines'],
    queryFn: () => machineApi.countByStatuses([MachineStatus.DOWN, MachineStatus.MAINTENANCE]),
    refetchInterval: 30000,
  });

  const activeFaultsDisplay = isActiveFaultsLoading ? '...' : activeFaultsCount ?? 0;
  const stoppedMachinesDisplay = isStoppedMachinesLoading ? '...' : stoppedMachinesCount ?? 0;

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500">الأعطال الحالية</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {activeFaultsDisplay}
                </p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {isActiveFaultsError && (
              <p className="text-xs text-red-500 mt-3">
                تعذر تحميل عدد الأعطال الحالية
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-rose-100 shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-500">الماكينات المتوقفة</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {stoppedMachinesDisplay}
                </p>
              </div>
              <div className="bg-rose-50 rounded-lg p-3">
                <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2m-6 0H7a2 2 0 01-2-2V6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v0" />
                </svg>
              </div>
            </div>
            {isStoppedMachinesError && (
              <p className="text-xs text-red-500 mt-3">
                تعذر تحميل عدد الماكينات المتوقفة
              </p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
