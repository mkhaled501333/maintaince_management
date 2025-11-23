'use client';

import { useEffect, useState } from 'react';
import { maintenanceTypeApi } from '@/lib/api/maintenance-types';
import { MaintenanceType } from '@/lib/types';

export default function MaintenanceTypesSection() {
  const [items, setItems] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{ name: string; description: string; category: string; isActive: boolean }>({
    name: '',
    description: '',
    category: '',
    isActive: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await maintenanceTypeApi.listMaintenanceTypes(undefined, true);
      setItems(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load maintenance types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      if (!form.name.trim()) {
        setCreateError('يجب إدخال الاسم');
        setCreating(false);
        return;
      }
      await maintenanceTypeApi.createMaintenanceType({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        isActive: form.isActive,
      });
      setForm({ name: '', description: '', category: '', isActive: true });
      await load();
    } catch (e: any) {
      const message = e?.response?.data?.detail || 'Failed to create maintenance type';
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">الاسم</label>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="مثال: صيانة تصحيحية"
                maxLength={100}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">الوصف</label>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="وصف اختياري"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">الفئة</label>
              <input
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="اختياري"
              />
            </div>
          </div>
          {createError && (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{createError}</div>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200" />
          <div className="p-4">
            {loading ? (
              <div className="text-gray-500">جاري التحميل...</div>
            ) : error ? (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">{error}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="px-4 py-2 font-medium text-gray-900">{it.name}</td>
                        <td className="px-4 py-2">{it.description || '-'}</td>
                        <td className="px-4 py-2">{it.category || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{new Date(it.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && <div className="text-sm text-gray-500 mt-4">لا توجد أنواع صيانة بعد.</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


