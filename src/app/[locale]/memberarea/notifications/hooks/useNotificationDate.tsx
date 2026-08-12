import { useFormatter } from 'next-intl';

import type { Notification } from '@/types/notification';

export const useNotificationDate = (notification: Notification) => {
  const format = useFormatter();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const date = notification.created_at > sevenDaysAgo
    ? format.relativeTime(notification.created_at)
    : format.dateTime(notification.created_at, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return {
    date,
  };
};
