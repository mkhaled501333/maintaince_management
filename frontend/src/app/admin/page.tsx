'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserRole } from '@/lib/types';
import AdminSidebar, { AdminMenuItem } from '@/components/admin/AdminSidebar';

interface AdminTab extends AdminMenuItem {
  id: string;
}

export default function AdminDashboardPage() {
  const [tabs, setTabs] = useState<AdminTab[]>([]);
  const [activeTabHref, setActiveTabHref] = useState<string | null>(null);
  const [homeTabMounted, setHomeTabMounted] = useState(false);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.href === activeTabHref) ?? null,
    [tabs, activeTabHref],
  );

  const handleItemSelect = (item: AdminMenuItem) => {
    setTabs((prev) => {
      if (prev.some((tab) => tab.href === item.href)) {
        return prev;
      }

      return [...prev, { ...item, id: item.href }];
    });

    setActiveTabHref(item.href);
  };

  const handleTabSelect = (href: string) => {
    setActiveTabHref(href);
  };

  const handleCloseTab = (href: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((tab) => tab.href !== href);

      if (activeTabHref === href) {
        if (filtered.length === 0) {
          setActiveTabHref(null);
        } else {
          const removedIndex = prev.findIndex((tab) => tab.href === href);
          const fallbackIndex = Math.min(removedIndex, filtered.length - 1);
          setActiveTabHref(filtered[fallbackIndex].href);
        }
      }

      return filtered;
    });
  };

  useEffect(() => {
    if (!homeTabMounted) {
      setTabs([
        {
          title: 'الرئيسية',
          href: '/admin/home',
          icon: null,
          id: '/admin/home',
        },
      ]);
      setActiveTabHref('/admin/home');
      setHomeTabMounted(true);
    }
  }, [homeTabMounted]);

  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 flex">
        {/* Sidebar */}
        <AdminSidebar onItemSelect={handleItemSelect} activePath={activeTabHref} />

        {/* Main Content */}
        <main className="flex-1 flex">
          <div className="flex-1">
            <div className="h-full w-full bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-white/50 flex flex-col">

              {/* Tabs */}
              {tabs.length > 0 ? (
                <>
                  <div className="px-4 py-3 border border-gray-200 bg-white/90 backdrop-blur rounded-xl shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      {tabs.map((tab) => {
                        const isActive = tab.href === activeTabHref;
                        return (
                          <div
                            key={tab.id}
                            className={`group/t tab flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                              isActive
                                ? 'bg-white text-indigo-600 border-indigo-500 shadow-sm'
                                : 'bg-gray-100/70 text-gray-600 border-gray-200 hover:bg-white hover:border-indigo-200 hover:text-indigo-600'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleTabSelect(tab.href)}
                              className="flex items-center gap-2 focus:outline-none"
                            >
                              <span>{tab.title}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCloseTab(tab.href)}
                              className={`ml-2 rounded-full p-1 transition-colors ${
                                isActive
                                  ? 'hover:bg-indigo-500/60'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                              }`}
                              aria-label="إغلاق التبويب"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-200 bg-gray-50/60 flex-1">
                    {activeTab ? (
                      <iframe
                        key={activeTab.href}
                        src={activeTab.href}
                        className="w-full h-full border-0"
                        title={activeTab.title}
                        loading="lazy"
                      ></iframe>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        يرجى اختيار تبويب لعرضه
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 px-6 py-10 flex flex-col items-center justify-center text-center text-gray-500">
                  <p className="text-lg font-medium mb-2">اختر قسماً من القائمة الجانبية للمتابعة</p>
                  <p className="text-sm text-gray-400">جميع أقسام الإدارة متاحة عبر الشريط الجانبي</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

