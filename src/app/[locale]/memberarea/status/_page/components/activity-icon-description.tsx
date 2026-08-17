import { Icon, type IconName } from '@/components/ui/icon';

import type { ActivityStatus } from '../activity-row';

const ICONS = {
  LOCATED: { name: 'pin-location', className: 'text-success' },
  READY: { name: 'list-check', className: 'text-neutral' },
  REJECTED: { name: 'pin-location', className: 'text-error' },
  PENDING: { name: 'info', className: 'text-neutral' },
} as const satisfies Record<ActivityStatus, { name: IconName; className: string }>;

export const ActivityIconDescription = ({ status }: { status: ActivityStatus }) => {
  const { name, className } = ICONS[status];

  return <Icon name={name} className={className} />;
};
