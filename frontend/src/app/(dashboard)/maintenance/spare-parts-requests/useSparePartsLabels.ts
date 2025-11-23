import { useMemo } from 'react';

import {
  maintenanceRequestPriorityLabels,
  maintenanceRequestStatusLabels,
  maintenanceWorkStatusLabels,
} from '@/lib/locale';

import type { SparePartsRequestDetail } from './useSparePartsRequests';

type MaintenanceRequest = SparePartsRequestDetail['maintenanceRequest'];
type MaintenanceWork = SparePartsRequestDetail['maintenanceWork'];

interface SparePartsLabelsResult {
  maintenanceStatusLabel: string | undefined;
  maintenancePriorityLabel: string | undefined;
  maintenanceWorkStatusLabel: string | undefined;
}

export function useSparePartsLabels(
  maintenanceRequest: MaintenanceRequest | null | undefined,
  maintenanceWork: MaintenanceWork | null | undefined
): SparePartsLabelsResult {
  const maintenanceStatusLabel = useMemo(
    () => (maintenanceRequest ? maintenanceRequestStatusLabels[maintenanceRequest.status] : undefined),
    [maintenanceRequest]
  );

  const maintenancePriorityLabel = useMemo(
    () => (maintenanceRequest ? maintenanceRequestPriorityLabels[maintenanceRequest.priority] : undefined),
    [maintenanceRequest]
  );

  const maintenanceWorkStatusLabel = useMemo(
    () => (maintenanceWork ? maintenanceWorkStatusLabels[maintenanceWork.status] : undefined),
    [maintenanceWork]
  );

  return { maintenanceStatusLabel, maintenancePriorityLabel, maintenanceWorkStatusLabel };
}


