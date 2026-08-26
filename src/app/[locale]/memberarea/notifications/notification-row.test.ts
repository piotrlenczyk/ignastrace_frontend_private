import { describe, expect, it } from 'vitest';

import type { components } from '@/network/api/api';

import { toNotificationRows, unreadNotificationIds } from './notification-row';

/*
 * The mapping from the notification centre's items onto the screen's own rows.
 *
 * Everything this screen decides is decided here — where a row leads, which icon
 * it draws, whether it counts as unread, and which ids the read-marking write is
 * given — so this is where the promises the screen depends on live. Nothing
 * renders: the rules are about a page of items and the rows it becomes.
 */

type NotificationItem = components['schemas']['NotificationCenterItemResponse'];
type TargetType = components['schemas']['TargetResponse']['targetType'];

const notification = (id: string, targetType?: TargetType, targetId = `${id}-target`): NotificationItem => ({
  id,
  title: `Title of ${id}`,
  body: `Body of ${id}`,
  createdAt: '2026-08-20T09:00:00.000Z',
  context: targetType ? { target: { targetId, targetType } } : {},
});

const withRead = (item: NotificationItem, isRead: boolean | null | undefined): NotificationItem => ({
  ...item,
  context: { ...item.context, isRead },
});

describe('toNotificationRows', () => {
  it('opens a location request notification on that request’s detail screen', () => {
    const [row] = toNotificationRows([notification('located', 'LocationRequest', 'request-7')]);

    expect(row?.href).toBe('/memberarea/status/detail?id=request-7');
  });

  it('opens a reverse-lookup report notification on that report', () => {
    const [row] = toNotificationRows([notification('report-ready', 'ReverseLookupReport', 'report-7')]);

    expect(row?.href).toBe('/memberarea/status/report?id=report-7');
  });

  it('leaves a notification about something the screen has no destination for unpressable', () => {
    const [row] = toNotificationRows([notification('audited', 'AuditLog')]);

    expect(row?.href).toBeUndefined();
    expect(row?.icon).toBe('alert-circle');
  });

  it('leaves a notification with no target at all unpressable', () => {
    const [row] = toNotificationRows([notification('announcement')]);

    expect(row?.href).toBeUndefined();
    expect(row?.icon).toBe('alert-circle');
  });

  it('draws each row with the icon its own target type answers for', () => {
    const rows = toNotificationRows([
      notification('located', 'LocationRequest'),
      notification('report-ready', 'ReverseLookupReport'),
      notification('audited', 'AuditLog'),
    ]);

    expect(rows.map((row) => row.icon)).toEqual(['pin-location', 'phone', 'alert-circle']);
  });

  it('carries the copy and the arrival time through as the API stated them', () => {
    const [row] = toNotificationRows([notification('located', 'LocationRequest')]);

    expect(row).toMatchObject({
      id: 'located',
      title: 'Title of located',
      body: 'Body of located',
      createdAt: '2026-08-20T09:00:00.000Z',
    });
  });

  it('counts a notification as read only when the API says so in as many words', () => {
    const item = notification('located', 'LocationRequest');
    const rows = toNotificationRows([
      withRead(item, true),
      withRead(item, false),
      withRead(item, null),
      withRead(item, undefined),
      item,
    ]);

    expect(rows.map((row) => row.isUnread)).toEqual([false, true, true, true, true]);
  });

  it('preserves the order the page arrived in', () => {
    const rows = toNotificationRows([
      notification('third', 'LocationRequest'),
      notification('first', 'ReverseLookupReport'),
      notification('second'),
    ]);

    expect(rows.map((row) => row.id)).toEqual(['third', 'first', 'second']);
  });

  it('maps an empty page onto no rows', () => {
    expect(toNotificationRows([])).toEqual([]);
  });
});

describe('unreadNotificationIds', () => {
  it('names exactly the rows that are unread', () => {
    const item = notification('located', 'LocationRequest');
    const rows = toNotificationRows([
      withRead({ ...item, id: 'seen' }, true),
      withRead({ ...item, id: 'new' }, false),
      { ...item, id: 'unsaid' },
    ]);

    expect(unreadNotificationIds(rows)).toEqual(['new', 'unsaid']);
  });

  it('names nothing when every row has been read, so that nothing is written', () => {
    const rows = toNotificationRows([withRead(notification('seen', 'LocationRequest'), true)]);

    expect(unreadNotificationIds(rows)).toEqual([]);
  });
});
