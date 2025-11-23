'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProblemReportingForm from '@/components/maintenance/ProblemReportingForm';
import { machineApi } from '@/lib/api/machines';
import { Machine } from '@/lib/types';

const ProblemReportContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const machineId = searchParams.get('machineId');
  const [machine, setMachine] = React.useState<Machine | null>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const loadMachine = async () => {
      if (machineId) {
        try {
          const machineData = await machineApi.getMachine(parseInt(machineId));
          setMachine(machineData);
        } catch (err) {
          console.error('Error loading machine:', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadMachine();
  }, [machineId]);

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل معلومات الماكينة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <ProblemReportingForm machine={machine} onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

const ProblemReportPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <ProblemReportContent />
    </Suspense>
  );
};

export default ProblemReportPage;
