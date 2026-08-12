'use client';

import { useTranslations } from 'next-intl';

import { IconNotificationRingingLine } from '@/components/ui/icon/icons/NotificationRingingLine';

export const NotificationError = () => {
  const t = useTranslations('common.errors');
  return (
    <div className="text-center">
      <div className="brand-icon mx-auto mb-4 size-24 rounded-3xl bg-primary ">
        <IconNotificationRingingLine className="size-12" />
      </div>
      <h2 className="h4 mb-1">{t('server_error')}</h2>
      <p>{t('server_error_description')}</p>
    </div>
  );
};
