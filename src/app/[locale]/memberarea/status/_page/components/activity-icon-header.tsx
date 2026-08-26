import { Icon, type IconName } from '@/components/ui/icon';

import type { ActivityKind } from '../activity-row';

const ICONS = {
  LOCATION_BY_LINK: 'link',
  LOCATION_BY_NUMBER: 'chat',
  REVERSE_LOOKUP_REPORT: 'phone',
  SEX_OFFENDER_SEARCH_REPORT: 'shield',
} as const satisfies Record<ActivityKind, IconName>;

export const ActivityIconHeader = ({ kind }: { kind: ActivityKind }) => {
  return (
    <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
      <Icon name={ICONS[kind]} className="size-5 text-white" />
    </div>
  );
};
