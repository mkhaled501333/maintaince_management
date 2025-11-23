import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-300">403</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">
            تم رفض الوصول
          </h2>
          <p className="text-gray-600 mt-2">
            ليس لديك صلاحية للوصول إلى هذا المورد.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            الذهاب إلى لوحة التحكم
          </Link>
          <Link
            href="/login"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
          >
            تسجيل الخروج
          </Link>
        </div>
      </div>
    </div>
  );
}
