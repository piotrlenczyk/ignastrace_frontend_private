import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/components/ui/icon';

export const Info = ({ description, icon }: { description: string | ReactNode; icon: IconName }) => {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} className="size-6 text-secondary" />
      <div className="text-sm text-strong">{description}</div>
    </div>
  );
};
