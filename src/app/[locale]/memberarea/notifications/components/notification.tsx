import type { ReactNode } from 'react';

import { Icon } from '@/components/ui/icon';
import { Link } from '@/libs/i18n-routing';

import { useNotificationDate } from '../hooks/useNotificationDate';
import type { NotificationRow } from '../notification-row';

const ItemWrapper = ({ className, children, href }: { className: string; children: ReactNode; href?: string }) => {
  return href ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
};

/**
 * One notification, as the backend wrote it.
 *
 * The title and the body are shown as plain text rather than composed here: the
 * new API renders a notification's copy itself, and the location type and phone
 * number the screen used to build a sentence from are not on the response at all.
 *
 * A row without a destination is a plain block rather than a link — a
 * notification about something this screen cannot open must not send anybody to a
 * screen with nothing on it.
 */
export const NotificationItem = ({ row }: { row: NotificationRow }) => {
  const { date } = useNotificationDate(row.createdAt);

  return (
    <ItemWrapper className="flex gap-3 p-2" href={row.href}>
      <div className="brand-icon-primary-weak size-12">
        <Icon name={row.icon} className="text-primary" />
      </div>

      <div className="flex-1">
        <p className="overflow-hidden font-semibold">{row.title}</p>
        <p className="overflow-hidden">{row.body}</p>
        <p className="text-sm text-weak">{date}</p>
      </div>

      {row.isUnread && <div className="size-3 shrink-0 rounded-full bg-primary" />}
    </ItemWrapper>
  );
};
