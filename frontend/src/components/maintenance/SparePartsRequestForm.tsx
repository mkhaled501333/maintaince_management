'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sparePartsRequestsApi } from '../../lib/api/spare-parts-requests';
import { sparePartsApi } from '../../lib/api/spare-parts';
import { SparePartsRequestCreate } from '../../lib/types';

interface SparePartsRequestFormProps {
  maintenanceWorkId: number;
  onSave: () => void;
  onCancel: () => void;
}

export function SparePartsRequestForm({ maintenanceWorkId, onSave, onCancel }: SparePartsRequestFormProps) {
  const [formData, setFormData] = useState<SparePartsRequestCreate>({
    maintenanceWorkId,
    sparePartId: 0,
    quantityRequested: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch spare parts for dropdown
  const { data: sparePartsData } = useQuery({
    queryKey: ['spare-parts-available'],
    queryFn: () => sparePartsApi.getAvailableSpareParts({ page: 1, pageSize: 1000 }),
  });

  // Fetch selected spare part details for stock display
  const { data: selectedSparePart } = useQuery({
    queryKey: ['spare-part', formData.sparePartId],
    queryFn: () => sparePartsApi.getSparePart(formData.sparePartId),
    enabled: formData.sparePartId > 0,
  });

  // Track form changes
  useEffect(() => {
    const hasChanges = formData.sparePartId > 0 && formData.quantityRequested > 0;
    setHasChanges(hasChanges);
  }, [formData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter spare parts based on search query
  const filteredSpareParts = sparePartsData?.spareParts.filter((part) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      part.partNumber.toLowerCase().includes(query) ||
      part.partName.toLowerCase().includes(query)
    );
  }) || [];

  // Get selected spare part for display
  const selectedSparePartDisplay = sparePartsData?.spareParts.find(
    (part) => part.id === formData.sparePartId
  );

  const createMutation = useMutation({
    mutationFn: (data: SparePartsRequestCreate) => sparePartsRequestsApi.createRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts-requests'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-work'] });
      setHasChanges(false);
      onSave();
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'تعذر إنشاء طلب القطع. يرجى المحاولة مرة أخرى.';
      if (message.includes('not found')) {
        setErrors({ sparePartId: 'لم يتم العثور على قطعة الغيار المحددة' });
      } else if (message.includes('insufficient')) {
        setErrors({ quantityRequested: 'الكمية غير كافية. يرجى التحقق من المخزون المتاح.' });
      } else {
        alert(message);
      }
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sparePartId || formData.sparePartId <= 0) {
      newErrors.sparePartId = 'يرجى اختيار قطعة الغيار';
    }
    if (!formData.quantityRequested || formData.quantityRequested <= 0) {
      newErrors.quantityRequested = 'يجب أن تكون الكمية أكبر من صفر';
    }
    if (selectedSparePart && selectedSparePart.currentStock < formData.quantityRequested) {
      newErrors.quantityRequested = `الكمية غير كافية. المتوفر حالياً: ${selectedSparePart.currentStock}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync(formData);
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  const handleChange = (field: keyof SparePartsRequestCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isSubmitting = createMutation.isPending;

  return (
    <div className="w-full max-w-full overflow-y-visible overflow-x-hidden relative bg-white text-gray-900 rounded-lg p-3 shadow-sm">
      {hasChanges && (
        <div className="mb-2 flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          لديك تغييرات غير محفوظة
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Spare Part Selection - Searchable Dropdown */}
        <div className={isDropdownOpen ? 'mb-48 sm:mb-56' : ''}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            قطعة الغيار <span className="text-red-500">*</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            {/* Search Input / Selected Value Display */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full px-2 sm:px-3 py-2 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 cursor-pointer text-xs sm:text-sm bg-white ${
                errors.sparePartId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className={`truncate ${selectedSparePartDisplay ? 'text-gray-900' : 'text-gray-400'}`}>
                  {selectedSparePartDisplay
                    ? `${selectedSparePartDisplay.partNumber} - ${selectedSparePartDisplay.partName}`
                    : 'ابحث أو اختر قطعة الغيار...'}
                </span>
                <svg
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-[9999] w-full mt-1 left-0 right-0 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-[25vh] sm:max-h-48 overflow-hidden">
                {/* Search Input */}
                <div className="p-1.5 sm:p-2 border-b border-gray-200 sticky top-0 bg-white z-10">
                  <input
                    type="text"
                    placeholder="بحث..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>

                {/* Options List */}
                <div className="overflow-y-auto max-h-[calc(25vh-55px)] sm:max-h-36">
                  {filteredSpareParts.length === 0 ? (
                    <div className="px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 text-center">
                      لا توجد قطع غيار مطابقة
                    </div>
                  ) : (
                    filteredSpareParts.map((part) => (
                      <div
                        key={part.id}
                        onClick={() => {
                          handleChange('sparePartId', part.id);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`px-2 sm:px-3 py-2 sm:py-2.5 cursor-pointer hover:bg-blue-50 transition-colors ${
                          formData.sparePartId === part.id ? 'bg-blue-100' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                              {part.partNumber} - {part.partName}
                            </div>
                            {part.currentStock !== undefined && (
                              <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                                المخزون: {part.currentStock}
                              </div>
                            )}
                          </div>
                          {formData.sparePartId === part.id && (
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0 ml-1 sm:ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.sparePartId && (
            <p className="mt-1.5 text-xs text-red-600">{errors.sparePartId}</p>
          )}
        </div>

        {/* White space section */}
        <div className="mb-4"></div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            الكمية <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={formData.quantityRequested}
            onChange={(e) => handleChange('quantityRequested', parseInt(e.target.value) || 0)}
            className={`w-full px-3 py-2.5 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm text-gray-900 bg-white ${
              errors.quantityRequested ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.quantityRequested && (
            <p className="mt-1.5 text-xs text-red-600">{errors.quantityRequested}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            إلغاء
          </button>
          {hasChanges && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  إرسال الطلب
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

