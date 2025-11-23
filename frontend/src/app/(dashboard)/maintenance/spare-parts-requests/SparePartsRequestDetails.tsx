/**
 * Side-panel component that renders the full detail view for a spare parts request.
 * Receives data from the `useSparePartsRequests` hook and only concerns itself with presentation.
 */
'use client';

import type { ReactElement } from 'react';
import { formatDateArabic, machineStatusLabels, sparePartsRequestStatusLabels } from '@/lib/locale';
import type { SparePartsRequestDetail } from './useSparePartsRequests';
import styles from './sparePartsRequests.module.css';
import { InfoRow } from './InfoRow';
import { useSparePartsLabels } from './useSparePartsLabels';

interface SparePartsRequestDetailsProps {
  data: SparePartsRequestDetail | null;
  onClose: () => void;
}

export function SparePartsRequestDetails({ data, onClose }: SparePartsRequestDetailsProps): ReactElement | null {
  const { machine, maintenanceRequest, maintenanceWork, spareRequest } = data ?? {};

  const { maintenanceStatusLabel, maintenancePriorityLabel, maintenanceWorkStatusLabel } = useSparePartsLabels(
    maintenanceRequest,
    maintenanceWork
  );

  if (!data || !spareRequest) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.detailOverlay} onClick={onClose} />
      <aside className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.headerContent}>
            <div>
              <span className={styles.headerBadge}>
                طلب قطع الغيار #{spareRequest.id}
              </span>
              <h2 className={styles.headerTitle}>تفاصيل بلاغ الصيانة</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="إغلاق اللوحة"
            >
              <svg className={styles.closeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.sections}>
            <section className={styles.primaryCard}>
              <div className={styles.primaryCardSummary}>
                <InfoRow label="الحالة الحالية" value={sparePartsRequestStatusLabels[spareRequest.status]} highlight />
                <InfoRow label="تاريخ الإنشاء" value={formatDateArabic(spareRequest.createdAt)} icon="calendar" />
                <InfoRow
                  label="تم الطلب بواسطة"
                  value={spareRequest.requestedByName || `المستخدم رقم ${spareRequest.requestedBy}`}
                  icon="user"
                  full
                />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <InfoRow label="رقم قطعة الغيار" value={spareRequest.sparePartNumber || 'غير متوفر'} icon="tag" />
                  <InfoRow label="اسم القطعة" value={spareRequest.sparePartName || 'غير متوفر'} icon="cube" />
                  <InfoRow label="الكمية المطلوبة" value={spareRequest.quantityRequested} icon="hash" />
                  <InfoRow
                    label="المخزون الحالي"
                    value={spareRequest.currentStock !== undefined ? spareRequest.currentStock : 'غير متاح'}
                    icon="boxes"
                  />
                </div>
                <div className={styles.cardGridSecondary}>
                  <InfoRow label="آخر تحديث" value={formatDateArabic(spareRequest.updatedAt)} icon="calendar" />
                  {spareRequest.approvedBy && (
                    <InfoRow
                      label="آخر معتمد"
                      value={spareRequest.approvedByName || `المستخدم رقم ${spareRequest.approvedBy}`}
                      icon="shield"
                    />
                  )}
                </div>
              </div>
            </section>

            {maintenanceRequest ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>تفاصيل بلاغ الصيانة</h3>
                  <div className={styles.sectionMeta}>
                    {maintenanceStatusLabel && (
                      <span className={styles.statusBadge}>
                        {maintenanceStatusLabel}
                      </span>
                    )}
                    {maintenancePriorityLabel && (
                      <span className={styles.priorityBadge}>
                        {maintenancePriorityLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.sectionContent}>
                  <div>
                    <span className={styles.sectionLabel}>عنوان البلاغ</span>
                    <p className={styles.sectionPrimaryText}>{maintenanceRequest.title}</p>
                  </div>
                  <div>
                    <span className={styles.sectionLabel}>الوصف</span>
                    <p className={styles.sectionDescription}>
                      {maintenanceRequest.description || 'لا يوجد وصف'}
                    </p>
                  </div>
                  <div className={styles.cardGrid}>
                    <InfoRow label="تاريخ الطلب" value={formatDateArabic(maintenanceRequest.requestedDate)} icon="calendar" />
                    {maintenanceRequest.expectedCompletionDate && (
                      <InfoRow
                        label="الإكمال المتوقع"
                        value={formatDateArabic(maintenanceRequest.expectedCompletionDate)}
                        icon="clock"
                      />
                    )}
                    {maintenanceRequest.actualCompletionDate && (
                      <InfoRow
                        label="الإكمال الفعلي"
                        value={formatDateArabic(maintenanceRequest.actualCompletionDate)}
                        icon="check"
                      />
                    )}
                  </div>
                </div>
              </section>
            ) : (
              <section className={styles.emptyState}>
                لا توجد بيانات لبلاغ الصيانة المرتبط بهذا الطلب.
              </section>
            )}

            {machine && (
              <section className={styles.sectionCard}>
                <div className={styles.sectionDividerHeader}>
                  <h3 className={styles.sectionTitle}>معلومات الماكينة</h3>
                </div>
                <div className={styles.cardGridPadded}>
                  <InfoRow label="اسم الماكينة" value={machine.name} icon="cpu" />
                  <InfoRow label="الموديل" value={machine.model || 'غير متاح'} icon="bookmark" />
                  <InfoRow label="الرقم التسلسلي" value={machine.serialNumber || 'غير متاح'} icon="hash" />
                  <InfoRow label="الموقع" value={machine.location || 'غير محدد'} icon="map" />
                  <InfoRow
                    label="الحالة الحالية"
                    value={machine.status ? machineStatusLabels[machine.status] : 'غير متاح'}
                    icon="pulse"
                  />
                  <InfoRow label="القسم" value={machine.department?.name || 'غير متاح'} icon="building" />
                </div>
              </section>
            )}

            {maintenanceWork && (
              <section className={styles.sectionCard}>
                <div className={styles.workHeader}>
                  <h3 className={styles.sectionTitle}>تفاصيل العمل</h3>
                  {maintenanceWorkStatusLabel && (
                    <span className={styles.workStatusBadge}>
                      {maintenanceWorkStatusLabel}
                    </span>
                  )}
                </div>
                <div className={styles.sectionContent}>
                  <div className={styles.cardGrid}>
                    <InfoRow label="رقم العمل" value={`#${maintenanceWork.id}`} icon="clipboard" />
                    <InfoRow
                      label="المكلف"
                      value={maintenanceWork.assignedToId ? `المستخدم رقم ${maintenanceWork.assignedToId}` : 'غير محدد'}
                      icon="user"
                    />
                    {maintenanceWork.startTime && (
                      <InfoRow label="تاريخ البدء" value={formatDateArabic(maintenanceWork.startTime)} icon="calendar" />
                    )}
                    {maintenanceWork.endTime && (
                      <InfoRow label="تاريخ الانتهاء" value={formatDateArabic(maintenanceWork.endTime)} icon="calendar" />
                    )}
                    {maintenanceWork.estimatedHours !== undefined && (
                      <InfoRow label="الساعات المقدرة" value={maintenanceWork.estimatedHours} icon="clock" />
                    )}
                    {maintenanceWork.actualHours !== undefined && (
                      <InfoRow label="الساعات الفعلية" value={maintenanceWork.actualHours} icon="clock" />
                    )}
                  </div>

                  <div>
                    <span className={styles.sectionLabel}>وصف العمل</span>
                    <p className={styles.sectionDescription}>
                      {maintenanceWork.workDescription || 'لا يوجد وصف'}
                    </p>
                  </div>

                  {maintenanceWork.maintenanceSteps && maintenanceWork.maintenanceSteps.length > 0 && (
                    <div>
                      <span className={styles.sectionLabelWithMargin}>خطوات العمل</span>
                      <ul className={styles.stepsList}>
                        {maintenanceWork.maintenanceSteps.map((step) => (
                          <li
                            key={step.step}
                            className={styles.stepItem}
                          >
                            <span className={styles.stepNumber}>
                              {step.step}
                            </span>
                            <div className={styles.stepContent}>
                              <p className={styles.stepDescription}>{step.description}</p>
                              {step.completed && (
                                <p className={styles.stepCompleted}>
                                  مكتمل في {formatDateArabic(step.completedAt)}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

