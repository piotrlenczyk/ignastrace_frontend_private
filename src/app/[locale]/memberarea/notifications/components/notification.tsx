import type { ReactNode } from 'react';

import { IconLinkAlt01, IconLocationPinCancelLine, IconLocationPinLine } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import type { Notification } from '@/types/notification';

import { useNotificationDate } from '../hooks/useNotificationDate';
import { useNotificationText } from '../hooks/useNotificationText';

const Icons = {
  'LinkLocation-located': IconLinkAlt01,
  'LinkLocation-rejected': IconLinkAlt01,
  'PhoneLocation-located': IconLocationPinLine,
  'PhoneLocation-rejected': IconLocationPinCancelLine,
};

const ItemWrapper = ({
  className,
  children,
  href,
}: {
  className: string;
  children: ReactNode;
  href?: string;
}) => {
  return href
    ? (
        <Link href={href} className={className}>
          {children}
        </Link>
      )
    : (<div className={className}>{children}</div>);
};

export const NotificationItem = ({ notification }: { notification: Notification }) => {
  const isLocated = notification.kind === 'located';
  const href = isLocated ? `${ROUTES.MEMBER.STATUS.DETAIL}?id=${notification.location.id}` : undefined;

  const Icon = Icons[`${notification.location.type}-${notification.kind}`];
  const { date } = useNotificationDate(notification);
  const { text_accessed, text } = useNotificationText(notification);

  return (
    <ItemWrapper className="flex gap-3 p-2" href={href}>
      <div className={cn(isLocated ? 'brand-icon-secondary-weak' : 'brand-icon-primary-weak', 'size-12')}>
        <Icon size="large" className={isLocated ? 'text-secondary' : 'text-primary'} />
      </div>

      <div className="flex-1">
        { text_accessed
          ? (
              <p className="overflow-hidden">
                { text_accessed }
                <span>
                  {' '}
                  { text }
                </span>
              </p>
            )
          : (
              <p>{ text }</p>
            )}
        <p className="text-sm text-weak">{ date }</p>
      </div>

      { notification.status === 'unread' && (
        <div className="size-3 shrink-0 rounded-full bg-primary" />
      )}
    </ItemWrapper>
  );
};
