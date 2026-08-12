import { useTranslations } from 'next-intl';

import { usePhoneNumberFormatter } from '@/hooks/use-phone-number-formatter';
import type { Notification } from '@/types/notification';

const translations = {
  'LinkLocation-located': 'link_located',
  'LinkLocation-rejected': 'link_rejected',
  'PhoneLocation-located': 'phone_located',
  'PhoneLocation-rejected': 'phone_rejected',
} as const;

export const useNotificationText = (notification: Notification) => {
  const t = useTranslations('pages.notifications');

  const text_accessed = notification.location.type === 'LinkLocation'
    ? t.rich('link_accessed', {
      strong: chunks => (
        <strong>
          {chunks}
        </strong>
      ),
      notificationName: notification.location.name,
    })
    : null;

  const text = t.rich(translations[`${notification.location.type}-${notification.kind}`], {
    strong: chunks => (
      <strong>
        {chunks}
      </strong>
    ),
    notificationName: notification.location.name,
    phone: usePhoneNumberFormatter(notification.location.phone).number,
  });

  return {
    text_accessed,
    text,
  };
};
