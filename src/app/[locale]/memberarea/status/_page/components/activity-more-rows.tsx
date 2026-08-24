'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { $api } from '@/network/api/api-browser-client';

import { toActivityRows } from '../activity-list';
import { rowKey } from '../activity-row';
import { ActivityItem } from './activity-item';

type ActivityMoreRowsProps = {
  /** Where the feed carried on from the page the server already rendered. */
  cursor: string;
  pageSize: number;
};

/**
 * Everything on the feed after the page the screen was rendered with.
 *
 * The first page comes from the server and is already on the screen, so this
 * component starts at the cursor that page ended on and never asks for it again:
 * no page is fetched twice, and nothing has to be handed across the boundary as
 * initial data. It is mounted only when there is a cursor to carry on from,
 * which is what lets that cursor be a plain string rather than a maybe.
 *
 * Nothing is fetched until the member asks. `enabled` is what holds the first
 * page of this series back — a disabled query ignores `fetchNextPage`, so the
 * first press turns the query on and every press after it asks for the page
 * after the last one.
 *
 * A failure produces no rows and leaves the button where it is, so pressing it
 * again asks for the same page again. Nothing else is said about it: the rows
 * already on the screen came from the server and cannot be lost by anything that
 * happens here.
 */
export const ActivityMoreRows = ({ cursor, pageSize }: ActivityMoreRowsProps) => {
  const t = useTranslations('pages.status');
  const [started, setStarted] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetching, isError } = $api.useInfiniteQuery(
    'get',
    '/api/v1/activity-feed',
    /*
     * The starting cursor is stated in the request as well as in the page
     * parameter, because that is what puts it in the query's key. Without it a
     * return to this screen would find the pages fetched from a *previous*
     * cursor still cached and render them under a first page the server has
     * since re-read — repeating any row that has moved up onto it. The value is
     * the same one the first page is fetched with, so stating it changes no
     * request.
     */
    { params: { query: { limit: pageSize, cursor } } },
    {
      enabled: started,
      initialPageParam: cursor,
      getNextPageParam: (page) => page.nextCursor ?? undefined,
      /*
       * A page already fetched is not fetched again while the member is on this
       * screen: the pages below the first are only ever appended, and refetching
       * them on a window focus would reshuffle rows under a reader mid-scroll.
       */
      staleTime: Infinity,
    },
  );

  const rows = (data?.pages ?? []).flatMap((page) => toActivityRows(page.data));

  /*
   * Before the first press there is nothing fetched to ask `hasNextPage` about,
   * and a page that failed leaves nothing to ask either — so the button stays on
   * a failure rather than vanishing, and pressing it again is the retry.
   */
  const canLoadMore = !started || hasNextPage || isError;

  return (
    <>
      {rows.map((row) => (
        <ActivityItem key={rowKey(row)} row={row} />
      ))}

      {canLoadMore && (
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={isFetching}
          onClick={() => (started ? fetchNextPage() : setStarted(true))}
        >
          {t('load_more_button')}
        </Button>
      )}
    </>
  );
};
