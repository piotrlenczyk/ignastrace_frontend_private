import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { TRACKING_PREFIX } from '@/constants/tracking';

import { handleTracking } from './tracking.middleware';

describe('handleTracking', () => {
  it('does not set or reset tracking cookies when only internal params (e.g. plan) are present', () => {
    const request = new NextRequest('https://mobitrace.io/pricing?plan=subscription');

    const response = handleTracking(request);

    expect(response.cookies.getAll()).toHaveLength(0);
  });

  it('sets tracking cookies when a real marketing param is present', () => {
    const request = new NextRequest('https://mobitrace.io/pricing?utm_source=facebook');

    const response = handleTracking(request);

    const cookieNames = response.cookies.getAll().map((c) => c.name);

    expect(cookieNames).toContain(`${TRACKING_PREFIX}utm_source`);
  });

  it('sets tracking cookies for marketing params while excluding internal params', () => {
    const request = new NextRequest('https://mobitrace.io/pricing?utm_source=facebook&plan=subscription');

    const response = handleTracking(request);

    const cookieNames = response.cookies.getAll().map((c) => c.name);

    expect(cookieNames).toContain(`${TRACKING_PREFIX}utm_source`);
    expect(cookieNames).not.toContain(`${TRACKING_PREFIX}plan`);
  });

  it('does not delete existing tracking cookies when only internal params are present', () => {
    const request = new NextRequest('https://mobitrace.io/pricing?plan=subscription', {
      headers: {
        cookie: `${TRACKING_PREFIX}utm_source=facebook`,
      },
    });

    const response = handleTracking(request);

    expect(response.cookies.getAll()).toHaveLength(0);
  });
});
