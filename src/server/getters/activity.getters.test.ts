import { beforeEach, describe, expect, it } from 'vitest';

/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { refusal, resetKit, serveApi, signedIn } from '@/test/server-write-kit';

const { ACTIVITY_FEED_PAGE_SIZE, getActivityFeed } = await import('./activity.getters');

/*
 * The activity feed's first page, read from the new API.
 *
 * What this getter promises its caller is small and worth holding still: it asks
 * the feed for a page of a stated size, it hands back the page and the cursor
 * exactly as the API stated them, and a refusal is a rejection rather than an
 * empty list — a screen must not read "the API said no" as "you have done
 * nothing yet".
 */

const ACTIVITY_FEED_PATH = '/api/v1/activity-feed';

const LOCATION_ITEM = {
  id: 'location-1',
  kind: 'LOCATION_REQUEST',
  status: 'LOCATED',
  createdAt: '2026-08-16T09:00:00.000Z',
  updatedAt: '2026-08-16T10:00:00.000Z',
  statusUpdatedAt: '2026-08-16T10:00:00.000Z',
  phone: '+12025550123',
  location: {
    type: 'FIND_BY_NUMBER',
    shareLink: 'https://app.example.com/l/1c383cd30b7c298ab50293adfecb7b18',
    address: '1600 Pennsylvania Avenue NW, Washington',
  },
  retryable: false,
};

const serveFeed = (body: unknown) => serveApi({ [ACTIVITY_FEED_PATH]: { status: 200, body } });

beforeEach(async () => {
  resetKit();
  await signedIn();
});

describe('getActivityFeed', () => {
  it('asks the feed for one page of the stated size', async () => {
    const api = serveFeed({ data: [] });

    await getActivityFeed();

    const { searchParams } = new URL(api.request(ACTIVITY_FEED_PATH).url);

    expect(api.paths()).toEqual([ACTIVITY_FEED_PATH]);
    expect(searchParams.get('limit')).toBe(String(ACTIVITY_FEED_PAGE_SIZE));
    expect(searchParams.has('cursor')).toBe(false);
  });

  it('hands back the page and the cursor as the API stated them', async () => {
    serveFeed({ data: [LOCATION_ITEM], nextCursor: 'cursor-2' });

    expect(await getActivityFeed()).toEqual({ data: [LOCATION_ITEM], nextCursor: 'cursor-2' });
  });

  it('answers an exhausted feed with a page carrying no cursor', async () => {
    serveFeed({ data: [] });

    expect(await getActivityFeed()).toEqual({ data: [] });
  });

  it('rejects a refusal rather than reading it as an empty feed', async () => {
    serveApi({
      [ACTIVITY_FEED_PATH]: { status: 401, body: refusal('UNAUTHORIZED', 'unauthorized', 'Unauthorized') },
    });

    await expect(getActivityFeed()).rejects.toThrow();
  });
});
