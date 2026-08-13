import type { useTranslations } from 'next-intl';

import type { ServiceRequestStatus } from '@/types/service-request';

import { STATUS_CLASSES } from '../constants';

type ServiceRequestStatusBadgeProps = {
  status: ServiceRequestStatus;
  t: ReturnType<typeof useTranslations>;
};

export const ServiceRequestStatusBadge = ({ status, t }: ServiceRequestStatusBadgeProps) => {
  return <div className={STATUS_CLASSES[status]}>{t(`${status}_status`)}</div>;
};
