import type { useTranslations } from 'next-intl';

import type { ActivityStatus } from '../activity-row';
import { STATUS_CLASSES, STATUS_LABEL_KEYS } from '../constants';

type ActivityStatusBadgeProps = {
  status: ActivityStatus;
  t: ReturnType<typeof useTranslations>;
};

export const ActivityStatusBadge = ({ status, t }: ActivityStatusBadgeProps) => {
  return <div className={STATUS_CLASSES[status]}>{t(STATUS_LABEL_KEYS[status])}</div>;
};
