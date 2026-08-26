import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

import type { NotificationRow } from '../notification-row';
import { NotificationItem } from './notification';

type NotificationListProps = {
  rows: NotificationRow[];
  /** Whether the centre carries on past the pages already loaded. */
  hasMore: boolean;
  isFetching: boolean;
  fetchMoreFn: () => void;
};

const Results = ({ rows, hasMore, isFetching, fetchMoreFn }: NotificationListProps) => {
  const t = useTranslations('pages.notifications');

  return (
    <>
      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <NotificationItem row={row} key={row.id} />
        ))}
      </div>
      {hasMore && (
        <Button className="mt-4 w-full" variant="secondary" size="lg" disabled={isFetching} onClick={fetchMoreFn}>
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

export const NotificationList = (props: NotificationListProps) => {
  return props.rows.length ? <Results {...props} /> : <EmptyState />;
};
