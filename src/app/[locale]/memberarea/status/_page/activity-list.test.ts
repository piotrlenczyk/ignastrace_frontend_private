import { describe, expect, it } from 'vitest';

import type { components } from '@/network/api/api';

import { toActivityRows } from './activity-list';

/*
 * The mapping from the activity feed's items onto the list's own rows.
 *
 * This is where the two kinds the feed answers for are absorbed, so it is where
 * the promises the screen depends on live: that a location request lands on the
 * kind its type names, that a row is titled by the right field for its kind,
 * that both status vocabularies land on the four the screen knows, that a status
 * nobody has taught it yet is still a visible row, and that the feed's order is
 * carried through rather than re-sorted.
 */

type ActivityItem = components['schemas']['ActivityItemResponse'];

const NUMBER_REQUEST: ActivityItem = {
  id: 'number-1',
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

const LINK_REQUEST: ActivityItem = {
  id: 'link-1',
  kind: 'LOCATION_REQUEST',
  status: 'PENDING',
  createdAt: '2026-08-14T09:00:00.000Z',
  updatedAt: '2026-08-14T10:00:00.000Z',
  statusUpdatedAt: '2026-08-14T10:00:00.000Z',
  location: {
    type: 'FIND_BY_LINK',
    shareLink: 'https://app.example.com/l/6f1ed002ab5595859014ebf0951522d9515002f7f5c9',
    linkName: 'Find my sister',
  },
  retryable: false,
};

const REPORT: ActivityItem = {
  id: 'report-1',
  kind: 'REVERSE_LOOKUP_REPORT',
  status: 'COMPLETED',
  createdAt: '2026-08-15T09:00:00.000Z',
  updatedAt: '2026-08-15T10:00:00.000Z',
  statusUpdatedAt: '2026-08-15T10:00:00.000Z',
  phone: '+13105550147',
  retryable: false,
};

const withStatus = (item: ActivityItem, status: string): ActivityItem => ({ ...item, status });

describe('toActivityRows', () => {
  it('names a location request by the type it was made with', () => {
    expect(toActivityRows([NUMBER_REQUEST, LINK_REQUEST]).map((row) => row.kind)).toEqual([
      'LOCATION_BY_NUMBER',
      'LOCATION_BY_LINK',
    ]);
  });

  it('carries a reverse lookup report through as its own kind', () => {
    expect(toActivityRows([REPORT])[0]?.kind).toBe('REVERSE_LOOKUP_REPORT');
  });

  it('titles a row by the field its kind is named after', () => {
    const rows = toActivityRows([NUMBER_REQUEST, LINK_REQUEST, REPORT]);

    expect(Object.fromEntries(rows.map((row) => [row.id, row.title]))).toEqual({
      'number-1': '+12025550123',
      'link-1': 'Find my sister',
      'report-1': '+13105550147',
    });
  });

  it('lands both sources’ statuses on the four the screen knows', () => {
    const items = [
      withStatus(NUMBER_REQUEST, 'PENDING'),
      withStatus(NUMBER_REQUEST, 'LOCATED'),
      withStatus(NUMBER_REQUEST, 'REJECTED'),
      withStatus(REPORT, 'PENDING'),
      withStatus(REPORT, 'PROCESSING'),
      withStatus(REPORT, 'COMPLETED'),
      withStatus(REPORT, 'FAILED'),
    ];

    expect(toActivityRows(items).map((row) => row.status)).toEqual([
      'PENDING',
      'LOCATED',
      'REJECTED',
      'PENDING',
      'PENDING',
      'READY',
      'REJECTED',
    ]);
  });

  it('keeps a row the screen has no status for, as one still waiting', () => {
    expect(toActivityRows([withStatus(REPORT, 'CANCELLED')])).toEqual([
      expect.objectContaining({ id: 'report-1', status: 'PENDING' }),
    ]);
  });

  it('carries a resolved address on the row, and nothing where there is none', () => {
    const rows = toActivityRows([NUMBER_REQUEST, LINK_REQUEST, REPORT]);

    expect(rows.find((row) => row.id === 'number-1')?.address).toBe('1600 Pennsylvania Avenue NW, Washington');
    expect(rows.find((row) => row.id === 'link-1')?.address).toBeUndefined();
    expect(rows.find((row) => row.id === 'report-1')?.address).toBeUndefined();
  });

  it('orders the rows as the feed ordered them', () => {
    const rows = toActivityRows([LINK_REQUEST, REPORT, NUMBER_REQUEST]);

    expect(rows.map((row) => row.id)).toEqual(['link-1', 'report-1', 'number-1']);
  });

  it('takes the row’s date from the feed’s own sort key', () => {
    expect(toActivityRows([REPORT])[0]?.updatedAt).toBe(REPORT.updatedAt);
  });

  it('answers an empty page with an empty list', () => {
    expect(toActivityRows([])).toEqual([]);
  });
});
