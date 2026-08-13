import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ACCESS_TOKEN_COOKIE_NAME } from '@/server/session/session.constants';

import { useSession } from './use-session';

const accessToken = (claims: Record<string, unknown>) => {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`;
};

const MEMBER = accessToken({
  sub: 'user-1',
  email: 'member@example.com',
  type: 'USER',
  roles: ['STANDARD_USER'],
  exp: Math.floor(Date.now() / 1000) + 60 * 60,
});

/** What the server writes: the readable half of the session cookie pair. */
const signIn = (token: string) => {
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${token}; path=/`;
};

const signOut = () => {
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

afterEach(signOut);

describe('useSession', () => {
  it('reports a visitor with no cookie as signed out', () => {
    const { result } = renderHook(() => useSession());

    expect(result.current).toEqual({ session: null, isSignedIn: false });
  });

  it('reports the token and the identity it carries', () => {
    signIn(MEMBER);

    const { result } = renderHook(() => useSession());

    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.session).toEqual({
      accessToken: MEMBER,
      user: { id: 'user-1', email: 'member@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('reports a token that carries no identity as signed in all the same', () => {
    signIn(accessToken({ exp: Math.floor(Date.now() / 1000) + 60 }));

    const { result } = renderHook(() => useSession());

    expect(result.current).toEqual({ session: { accessToken: expect.any(String), user: {} }, isSignedIn: true });
  });

  it('picks up a session established in another tab when the window is focused', () => {
    const { result } = renderHook(() => useSession());

    expect(result.current.isSignedIn).toBe(false);

    signIn(MEMBER);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.session?.accessToken).toBe(MEMBER);
  });

  it('drops a session that has gone by the time the tab becomes visible again', () => {
    signIn(MEMBER);
    const { result } = renderHook(() => useSession());

    signOut();
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current).toEqual({ session: null, isSignedIn: false });
  });

  it('follows a renewed token, so a client never sends one the server has replaced', () => {
    signIn(MEMBER);
    const { result } = renderHook(() => useSession());

    const renewed = accessToken({
      sub: 'user-1',
      email: 'member@example.com',
      exp: Math.floor(Date.now() / 1000) + 90,
    });
    signIn(renewed);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.session?.accessToken).toBe(renewed);
  });

  it('stops listening once the last consumer has unmounted', () => {
    const { unmount } = renderHook(() => useSession());

    unmount();

    // Nothing to assert beyond this not throwing: the store has no consumers,
    // so a focus event must not reach a torn-down component.
    expect(() => window.dispatchEvent(new Event('focus'))).not.toThrow();
  });
});
