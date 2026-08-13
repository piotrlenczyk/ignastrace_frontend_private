import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

import type { NotificationsApiResponse } from '../hooks/useGetNotifications';
import { NotificationItem } from './notification';

const Results = ({ data, fetchMoreFn }: { data: NotificationsApiResponse; fetchMoreFn: () => void }) => {
  const t = useTranslations('pages.notifications');

  return (
    <>
      <div className="flex flex-col gap-3">
        {data.notifications.map((notification) => (
          <NotificationItem notification={notification} key={notification.id} />
        ))}
      </div>
      {data.has_more && (
        <Button className="mt-4 w-full" variant="secondary" size="lg" onClick={fetchMoreFn}>
          {t('load_more')}
        </Button>
      )}
    </>
  );
};

const EmptyState = () => {
  const t = useTranslations('pages.notifications');

  return (
    <div className="text-center">
      <div className="brand-icon mx-auto mb-4 size-24 rounded-3xl">
        <Icon name="alert-circle" className="size-12" />
      </div>
      <h2 className="h4 mb-1">{t('empty.title')}</h2>
      <p>{t('empty.text')}</p>
    </div>
  );
};

export const NotificationList = ({
  data,
  fetchMoreFn,
}: {
  data: NotificationsApiResponse;
  fetchMoreFn: () => void;
}) => {
  return data.notifications && data.notifications.length ? (
    <Results data={data} fetchMoreFn={fetchMoreFn} />
  ) : (
    <EmptyState />
  );
};
