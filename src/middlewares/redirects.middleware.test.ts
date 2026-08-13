import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import type { AccountType, SessionData } from '@/server/session/session.types';

import { handleRedirects } from './redirects.middleware';

const SITE = 'https://ignastrace.io';

const sessionFor = (type: AccountType): SessionData => ({
  isLoggedIn: true,
  accessToken: 'access-token',
  accessTokenExpiresAt: 4102444800000,
  refreshToken: 'refresh-token',
  user: { id: 'user-1', email: 'member@example.com', type },
});

const requestFor = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`${SITE}${path}`, { headers });

const locationOf = (path: string, session: SessionData | null, headers?: Record<string, string>) =>
  handleRedirects(requestFor(path, headers), session)?.headers.get('location') ?? null;

describe('handleRedirects', () => {
  describe('protected routes', () => {
    it.each(['/memberarea/find-by-number', '/memberarea/settings/billing', '/checkout', '/thank-you', '/success'])(
      'sends an anonymous visitor on %s to the login page',
      (path) => {
        expect(locationOf(path, null)).toBe(`${SITE}/login?redirect=${encodeURIComponent(path)}`);
      },
    );

    it('preserves the locale prefix of the page the visitor was trying to reach', () => {
      expect(locationOf('/es/memberarea/status', null)).toBe(
        `${SITE}/es/login?redirect=${encodeURIComponent('/es/memberarea/status')}`,
      );
    });

    it('carries the query string of the original page as well as its path', () => {
      expect(locationOf('/checkout?plan=subscription', null)).toBe(
        `${SITE}/login?redirect=${encodeURIComponent('/checkout?plan=subscription')}`,
      );
    });

    it('treats a guest-typed session as anonymous', () => {
      expect(locationOf('/memberarea/find-by-number', sessionFor('GUEST'))).toBe(
        `${SITE}/login?redirect=${encodeURIComponent('/memberarea/find-by-number')}`,
      );
    });

    it('lets a signed-in member through', () => {
      expect(locationOf('/memberarea/find-by-number', sessionFor('USER'))).toBeNull();
    });

    it('lets a signed-in member through on a locale-prefixed path', () => {
      expect(locationOf('/es/checkout', sessionFor('USER'))).toBeNull();
    });
  });

  describe('auth routes', () => {
    it.each(['/login', '/sign-up', '/lookup-sign-up'])('sends a signed-in member on %s to the dashboard', (path) => {
      expect(locationOf(path, sessionFor('USER'))).toBe(`${SITE}/memberarea/find-by-number`);
    });

    it('keeps the locale prefix when sending a member to the dashboard', () => {
      expect(locationOf('/es/login', sessionFor('USER'))).toBe(`${SITE}/es/memberarea/find-by-number`);
    });

    it('drops the redirect parameter the visitor arrived with', () => {
      expect(locationOf('/login?redirect=%2Fcheckout', sessionFor('USER'))).toBe(`${SITE}/memberarea/find-by-number`);
    });

    it('lets an anonymous visitor see the login page', () => {
      expect(locationOf('/login', null)).toBeNull();
    });

    it('lets a guest-typed session see the login page', () => {
      expect(locationOf('/login', sessionFor('GUEST'))).toBeNull();
    });
  });

  describe('public routes', () => {
    it.each(['/', '/pricing', '/reverse-phone-lookup', '/es/pricing', '/memberareas'])(
      'leaves %s alone for an anonymous visitor',
      (path) => {
        expect(locationOf(path, null)).toBeNull();
      },
    );

    it('does not read an unknown first segment as a locale', () => {
      expect(locationOf('/marketing/memberarea/find-by-number', null)).toBeNull();
    });
  });

  describe('server actions', () => {
    it('does not redirect a server action posted to a protected route', () => {
      expect(locationOf('/memberarea/find-by-number', null, { 'next-action': 'a1b2c3' })).toBeNull();
    });

    it('does not redirect a server action posted to an auth route', () => {
      expect(locationOf('/login', sessionFor('USER'), { 'next-action': 'a1b2c3' })).toBeNull();
    });
  });
});
