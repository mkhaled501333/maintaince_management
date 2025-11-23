'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';
import DepartmentManagementSection from '@/components/admin/master-data/DepartmentManagementSection';
import FailureCodesSection from '@/components/admin/master-data/FailureCodesSection';
import MaintenanceTypesSection from '@/components/admin/master-data/MaintenanceTypesSection';

const tabs = [
  { id: 'departments', label: 'إدارة الأقسام' },
  { id: 'failure-codes', label: 'أكواد الأعطال' },
  { id: 'maintenance-types', label: 'أنواع الصيانة' },
] as const;

type TabId = typeof tabs[number]['id'];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabId>('departments');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentManagementSection />;
      case 'failure-codes':
        return <FailureCodesSection />;
      case 'maintenance-types':
        return <MaintenanceTypesSection />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="px-6 pt-4 pb-2 border-b border-gray-200 bg-white">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-gray-50/60">
              <div className="space-y-6">{renderActiveTab()}</div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


