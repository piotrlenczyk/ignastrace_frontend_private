'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import ProductLayout from '@/components/layouts/product-layout';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/libs/utils';

import { NotificationError } from './components/error';
import { NotificationList } from './components/notificationList';
import { useNotificationsQuery } from './hooks/useGetNotifications';

export default function NotificationsClientPage({ unreadNotifications }: { unreadNotifications: boolean }) {
  const t = useTranslations('pages.notifications');
  const { data, error, fetchNextPage, hasNextPage, isLoading } = useNotificationsQuery();

  const api = useApi();

  useEffect(() => {
    if (unreadNotifications && data?.notifications?.length) {
      api.post('/notifications/read', {});
    }
  }, [api, unreadNotifications, data]);

  const fetchMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  const notifications = data?.notifications ?? [];
  const hasMore = data?.has_more ?? false;

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="mb-4 h3 font-bold lg:mb-6">{t('title')}</h1>
        <div className={cn('flex flex-1 flex-col gap-4', notifications.length === 0 && 'justify-center')}>
          { error && <NotificationError /> }
          { !isLoading && !error && (
            <NotificationList
              data={{ notifications, has_more: hasMore }}
              fetchMoreFn={fetchMore}
            />
          )}
        </div>
      </main>
    </ProductLayout>
  );
};
