'use client';

import { createContext, type ReactNode, useMemo } from 'react';

import type { SessionUser } from '@/server/session/session.types';

export type ClientSession = {
  /**
   * The identity the sealed session holds. Complete, unlike what a token's
   * claims happened to carry: the server read it out of the cookie and rendered
   * it into the tree.
   */
  user: SessionUser;
};

export type SessionState = {
  session: ClientSession | null;
  isSignedIn: boolean;
};

export const SessionContext = createContext<SessionState | undefined>(undefined);

type SessionProviderProps = {
  user: SessionUser | null;
  children: ReactNode;
};

/*
 * Identity and nothing else. The access token and the refresh token stay in the
 * sealed cookie, on the server: a page script has no use for either now that
 * both proxies attach the bearer themselves, and an injected one has nothing to
 * take.
 *
 * The value is fixed for the lifetime of a render, so a signed-in member's
 * first paint is already the signed-in one — where the readable cookie this
 * replaced could only be seen after hydration. What changes it is a fresh
 * server render: sign-in, registration and sign-out revalidate the root layout,
 * and an email change refreshes the router.
 */
export function SessionProvider({ user, children }: SessionProviderProps) {
  const value = useMemo<SessionState>(
    () => (user ? { session: { user }, isSignedIn: true } : { session: null, isSignedIn: false }),
    [user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
