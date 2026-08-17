import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { API, resetKit, serveApi, signedIn } from '@/test/server-write-kit';

vi.stubEnv('INTERNAL_API_URL', API);

const { readActivityList } = await import('./activity-list');

/*
 * The activity list, read from the new API alone. What this seam is for is the
 * promises the screen depends on and cannot see from inside itself: that the list is
 * composed from the one source and the legacy endpoint is not reached at all, that
 * the rows arrive ordered by recency rather than in the order the API listed them,
 * that a row is titled by the right field for its kind, that an answered request
 * carries its resolved address, and that an empty answer is an empty list rather
 * than a failure.
 */

const LOCATION_REQUESTS_PATH = '/api/v1/location-requests';

/** The legacy merged endpoint, named only so a test can assert nothing reaches it. */
const SERVICE_REQUESTS_PATH = '/service_requests';

const LINK_REQUEST = {
  id: 'link-1',
  type: 'FIND_BY_LINK',
  status: 'PENDING',
  shareLink: 'https://app.example.com/l/6f1ed002ab5595859014ebf0951522d9515002f7f5c9',
  linkName: 'Find my sister',
  updatedAt: '2026-08-14T10:00:00.000Z',
};

const NUMBER_REQUEST = {
  id: 'number-1',
  type: 'FIND_BY_NUMBER',
  status: 'LOCATED',
  shareLink: 'https://app.example.com/l/1c383cd30b7c298ab50293adfecb7b18',
  phoneNumber: '+12025550123',
  capturedLatitude: 38.8977,
  capturedLongitude: -77.0365,
  resolvedAddress: '1600 Pennsylvania Avenue NW, Washington',
  updatedAt: '2026-08-16T10:00:00.000Z',
};

/** A second link request, older than the other two, so ordering has something to do. */
const OLDER_LINK_REQUEST = {
  id: 'link-2',
  type: 'FIND_BY_LINK',
  status: 'REJECTED',
  shareLink: 'https://app.example.com/l/9c1185a5c5e9fc54612808977ee8f548b2258d31',
  linkName: 'Find my brother',
  updatedAt: '2026-08-13T10:00:00.000Z',
};

const serveLocationRequests = (locationRequests: unknown[]) =>
  serveApi({
    [LOCATION_REQUESTS_PATH]: { status: 200, body: locationRequests },
    [SERVICE_REQUESTS_PATH]: { status: 200, body: [] },
  });

beforeEach(async () => {
  resetKit();
  await signedIn();
});

describe('readActivityList', () => {
  it('reads the new API alone and never the legacy source', async () => {
    const api = serveLocationRequests([LINK_REQUEST]);

    await readActivityList();

    expect(api.paths()).toEqual([LOCATION_REQUESTS_PATH]);
  });

  it('takes the location rows from the new API', async () => {
    serveLocationRequests([LINK_REQUEST, NUMBER_REQUEST]);

    const rows = await readActivityList();

    expect(rows.map((row) => row.kind)).toEqual(['LOCATION_BY_NUMBER', 'LOCATION_BY_LINK']);
  });

  it('orders the list by recency rather than by the order the API listed', async () => {
    serveLocationRequests([LINK_REQUEST, OLDER_LINK_REQUEST, NUMBER_REQUEST]);

    const rows = await readActivityList();

    expect(rows.map((row) => row.id)).toEqual([NUMBER_REQUEST.id, LINK_REQUEST.id, OLDER_LINK_REQUEST.id]);
  });

  it('carries the API’s statuses onto the list’s own vocabulary', async () => {
    serveLocationRequests([LINK_REQUEST, OLDER_LINK_REQUEST, NUMBER_REQUEST]);

    const rows = await readActivityList();

    expect(Object.fromEntries(rows.map((row) => [row.id, row.status]))).toEqual({
      'number-1': 'LOCATED',
      'link-1': 'PENDING',
      'link-2': 'REJECTED',
    });
  });

  it('titles a row by the field its kind is named after', async () => {
    serveLocationRequests([LINK_REQUEST, NUMBER_REQUEST]);

    const rows = await readActivityList();

    expect(Object.fromEntries(rows.map((row) => [row.id, row.title]))).toEqual({
      'link-1': 'Find my sister',
      'number-1': '+12025550123',
    });
  });

  it('carries an answered request’s resolved address on the row itself', async () => {
    serveLocationRequests([LINK_REQUEST, NUMBER_REQUEST]);

    const rows = await readActivityList();

    expect(rows.find((row) => row.id === NUMBER_REQUEST.id)?.address).toBe(NUMBER_REQUEST.resolvedAddress);
    expect(rows.find((row) => row.id === LINK_REQUEST.id)?.address).toBeUndefined();
  });

  it('answers with an empty list when the source has nothing', async () => {
    serveLocationRequests([]);

    expect(await readActivityList()).toEqual([]);
  });
});
