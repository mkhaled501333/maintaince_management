import {
  MachineStatus,
  RequestStatus,
  WorkStatus,
  SparePartsRequestStatus,
  TransactionType,
  ReferenceType,
  RequestPriority,
} from './types';

export const machineStatusLabels: Record<MachineStatus, string> = {
  [MachineStatus.OPERATIONAL]: 'تعمل بكفاءة',
  [MachineStatus.DOWN]: 'متوقفة',
  [MachineStatus.MAINTENANCE]: 'تحت الصيانة',
  [MachineStatus.DECOMMISSIONED]: 'خارج الخدمة',
};

export const maintenanceRequestStatusLabels: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: 'قيد الانتظار',
  [RequestStatus.IN_PROGRESS]: 'قيد التنفيذ',
  [RequestStatus.WAITING_PARTS]: 'في انتظار القطع',
  [RequestStatus.COMPLETED]: 'مكتمل',
  [RequestStatus.CANCELLED]: 'ملغى',
};

export const maintenanceWorkStatusLabels: Record<WorkStatus, string> = {
  [WorkStatus.PENDING]: 'لم يبدأ بعد',
  [WorkStatus.IN_PROGRESS]: 'جارٍ التنفيذ',
  [WorkStatus.COMPLETED]: 'مكتمل',
  [WorkStatus.ON_HOLD]: 'معلق',
  [WorkStatus.CANCELLED]: 'ملغى',
};

export const sparePartsRequestStatusLabels: Record<SparePartsRequestStatus, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  ISSUED: 'مصروف',
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  IN: 'توريد',
  OUT: 'صرف',
  ADJUSTMENT: 'تسوية',
  TRANSFER: 'نقل',
};

export const referenceTypeLabels: Record<ReferenceType, string> = {
  PURCHASE: 'شراء',
  MAINTENANCE: 'صيانة',
  ADJUSTMENT: 'تسوية',
  TRANSFER: 'نقل',
  RETURN: 'إرجاع',
};

export const maintenanceRequestPriorityLabels: Record<RequestPriority, string> = {
  CRITICAL: 'حرجة',
  HIGH: 'مرتفعة',
  MEDIUM: 'متوسطة',
  LOW: 'منخفضة',
};

export const booleanLabels: Record<'true' | 'false', string> = {
  true: 'نعم',
  false: 'لا',
};

export const RETURN_REQUESTED_BADGE = 'طلب إرجاع';
export const RETURNED_BADGE = 'تم الإرجاع';

export const formatDateArabic = (date?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!date) return 'غير متاح';
  try {
    return new Date(date).toLocaleDateString('ar-EG', options);
  } catch {
    return 'غير متاح';
  }
};

