import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason. The legacy source is reached through a base URL of its own, named here
 * because the kit only knows about the new API's.
 */
import { API, resetKit, serveApi, signedIn } from '@/test/server-write-kit';

vi.stubEnv('INTERNAL_API_URL', API);

const { readActivityList } = await import('./activity-list');

/*
 * The activity list, read from its two sources at once. What this seam is for is
 * the promises the screen depends on and cannot see from inside itself: that each
 * source contributes only the kinds it is there for, that the two arrive as one
 * list ordered by recency rather than one appended to the other, that both status
 * vocabularies land on the list's own, that a row is titled by the right field for
 * its kind, and that an empty answer from one source does not empty the other.
 */

const LOCATION_REQUESTS_PATH = '/api/v1/location-requests';

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

const REVERSE_LOOKUP = {
  id: 'lookup-1',
  source_type: 'ReverseLookup',
  status: 'ready',
  location: {},
  phone: '+12025550188',
  status_updated_at: '2026-08-15T10:00:00.000Z',
};

const SEX_OFFENDER_REPORT = {
  id: 'offender-1',
  source_type: 'SexOffenderSearchReport',
  status: 'pending',
  location: { name: 'Jane Roe' },
  status_updated_at: '2026-08-13T10:00:00.000Z',
};

/** A Location request as the legacy source also still answers for it. */
const LEGACY_LOCATION = {
  id: 'legacy-location-1',
  source_type: 'Location',
  status: 'located',
  location: { name: 'Find my sister', address: 'Somewhere else entirely' },
  status_updated_at: '2026-08-17T10:00:00.000Z',
};

const serveSources = (locationRequests: unknown[], serviceRequests: unknown[]) =>
  serveApi({
    [LOCATION_REQUESTS_PATH]: { status: 200, body: locationRequests },
    [SERVICE_REQUESTS_PATH]: { status: 200, body: serviceRequests },
  });

beforeEach(async () => {
  resetKit();
  await signedIn();
});

describe('readActivityList', () => {
  it('reads both sources', async () => {
    const api = serveSources([LINK_REQUEST], [REVERSE_LOOKUP]);

    await readActivityList();

    expect(api.paths().sort()).toEqual([LOCATION_REQUESTS_PATH, SERVICE_REQUESTS_PATH]);
  });

  it('takes the location rows from the new API and nothing else from it', async () => {
    serveSources([LINK_REQUEST, NUMBER_REQUEST], []);

    const rows = await readActivityList();

    expect(rows.map((row) => row.kind)).toEqual(['LOCATION_BY_NUMBER', 'LOCATION_BY_LINK']);
  });

  it('takes only the two surviving kinds from the legacy source', async () => {
    serveSources([], [LEGACY_LOCATION, REVERSE_LOOKUP, SEX_OFFENDER_REPORT]);

    const rows = await readActivityList();

    expect(rows.map((row) => row.kind)).toEqual(['REVERSE_LOOKUP_REPORT', 'SEX_OFFENDER_REPORT']);
  });

  it('orders the merged list by recency across kinds', async () => {
    serveSources([LINK_REQUEST, NUMBER_REQUEST], [REVERSE_LOOKUP, SEX_OFFENDER_REPORT]);

    const rows = await readActivityList();

    expect(rows.map((row) => row.id)).toEqual([NUMBER_REQUEST.id, REVERSE_LOOKUP.id, LINK_REQUEST.id, 'offender-1']);
  });

  it('maps both sources’ statuses onto the list’s own vocabulary', async () => {
    serveSources([LINK_REQUEST, NUMBER_REQUEST], [REVERSE_LOOKUP, SEX_OFFENDER_REPORT]);

    const rows = await readActivityList();

    expect(Object.fromEntries(rows.map((row) => [row.id, row.status]))).toEqual({
      'number-1': 'LOCATED',
      'lookup-1': 'READY',
      'link-1': 'PENDING',
      'offender-1': 'PENDING',
    });
  });

  it('titles a row by the field its kind is named after', async () => {
    serveSources([LINK_REQUEST, NUMBER_REQUEST], [REVERSE_LOOKUP, SEX_OFFENDER_REPORT]);

    const rows = await readActivityList();

    expect(Object.fromEntries(rows.map((row) => [row.id, row.title]))).toEqual({
      'link-1': 'Find my sister',
      'number-1': '+12025550123',
      'lookup-1': '+12025550188',
      'offender-1': 'Jane Roe',
    });
  });

  it('carries an answered request’s resolved address on the row itself', async () => {
    serveSources([LINK_REQUEST, NUMBER_REQUEST], []);

    const rows = await readActivityList();

    expect(rows.find((row) => row.id === NUMBER_REQUEST.id)?.address).toBe(NUMBER_REQUEST.resolvedAddress);
    expect(rows.find((row) => row.id === LINK_REQUEST.id)?.address).toBeUndefined();
  });

  it('leaves one source’s rows intact when the other answers with nothing', async () => {
    serveSources([], [REVERSE_LOOKUP]);

    expect((await readActivityList()).map((row) => row.id)).toEqual([REVERSE_LOOKUP.id]);

    serveSources([LINK_REQUEST], []);

    expect((await readActivityList()).map((row) => row.id)).toEqual([LINK_REQUEST.id]);
  });
});
