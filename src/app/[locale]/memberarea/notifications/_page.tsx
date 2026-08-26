'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef } from 'react';

import ProductLayout from '@/components/layouts/product-layout';
import { cn } from '@/libs/utils';
import { $api } from '@/network/api/api-browser-client';
import { useMarkNotificationsReadMutation } from '@/network/api/hooks/use-mark-notifications-read-mutation';
import { UNREAD_NOTIFICATION_COUNT_QUERY_KEY } from '@/network/api/hooks/use-unread-notification-count-query';

import { NotificationError } from './components/error';
import { NotificationList } from './components/notificationList';
import { toNotificationRows, unreadNotificationIds } from './notification-row';

/**
 * How many notifications a page carries.
 *
 * Stated rather than left to the endpoint, whose declared default is one — which
 * would open this screen on a single notification and a "load more" button. The
 * number is the activity list's, so the two paged screens in the member area
 * behave alike, and it is used for the first page and for every page after it.
 */
const PAGE_SIZE = 20;

export default function NotificationsClientPage() {
  const t = useTranslations('pages.notifications');
  const queryClient = useQueryClient();
  const { mutate: markAsRead } = useMarkNotificationsReadMutation();

  const { data, error, isLoading, isFetching, fetchNextPage, hasNextPage } = $api.useInfiniteQuery(
    'get',
    '/api/v1/notification/center',
    { params: { query: { limit: PAGE_SIZE } } },
    {
      /*
       * No cursor for the first page: a null query parameter is left out of the
       * request altogether, which is how the centre is asked for its beginning.
       */
      initialPageParam: null,
      getNextPageParam: (page) => page.pagination.nextCursor ?? undefined,
      /*
       * A page already fetched is not fetched again while the member is on this
       * screen. The pages below the first are only ever appended, and refetching
       * them on a window focus would reshuffle rows under a reader mid-scroll.
       */
      staleTime: Infinity,
      /*
       * And nothing is kept once they leave, which is the other half of that
       * bargain. A cached page still says "unread" — the read-marking write
       * changes that at the backend, not here — so a return to this screen inside
       * the cache's lifetime would re-render those rows as unread and write the
       * same ids again. Dropping the pages makes a return a fresh read, where the
       * notifications come back marked. A write that repeats with the same ids is
       * then what it is supposed to be: the symptom of a backend that is not
       * recording them.
       */
      gcTime: 0,
    },
  );

  /*
   * Mapped once per answer rather than once per render, so the rows are the same
   * array until a page arrives — which is what the read-marking below reacts to.
   */
  const rows = useMemo(() => (data?.pages ?? []).flatMap((page) => toNotificationRows(page.data)), [data]);

  /*
   * The ids already sent, so the write happens once per notification rather than
   * once per render. A page that arrives while this screen is open adds its own
   * unread ids and nothing else — which is what makes "load more" mark what it
   * revealed, on the same rule as the first page.
   *
   * A failed write is not retried here. The notifications are on the screen
   * either way, the badge stands — which is the honest picture of a write that
   * did not happen — and the next visit reads the centre again and writes them
   * then.
   */
  const written = useRef(new Set<string>());

  useEffect(() => {
    const ids = unreadNotificationIds(rows).filter((id) => !written.current.has(id));

    if (ids.length === 0) {
      return;
    }

    ids.forEach((id) => written.current.add(id));

    markAsRead(
      { body: { ids } },
      {
        /*
         * Invalidated rather than set to zero: with older unread notifications
         * still behind the cursor, the count after this write is not necessarily
         * nothing, and only the backend knows what it is.
         */
        onSuccess: () => queryClient.invalidateQueries({ queryKey: UNREAD_NOTIFICATION_COUNT_QUERY_KEY }),
      },
    );
  }, [markAsRead, queryClient, rows]);

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="mb-4 h3 font-bold lg:mb-6">{t('title')}</h1>
        <div className={cn('flex flex-1 flex-col gap-4', rows.length === 0 && 'justify-center')}>
          {error && <NotificationError />}
          {!isLoading && !error && (
            <NotificationList
              rows={rows}
              hasMore={hasNextPage}
              isFetching={isFetching}
              fetchMoreFn={() => fetchNextPage()}
            />
          )}
        </div>
      </main>
    </ProductLayout>
  );
}
