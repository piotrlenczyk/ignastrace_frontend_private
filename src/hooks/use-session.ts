'use client';

import { useMemo, useSyncExternalStore } from 'react';

import { readAccessTokenCookie } from '@/libs/session-cookie';
import { decodeAccessToken, readIdentityFromClaims } from '@/server/session/access-token';
import type { SessionUser } from '@/server/session/session.types';

export type ClientSession = {
  accessToken: string;
  /*
   * As much of the identity as the token's claims carry. The sealed cookie
   * holds the complete one, but a page script cannot read that — anything the
   * claims omit has to come from the server render.
   */
  user: Partial<SessionUser>;
};

export type SessionState = {
  session: ClientSession | null;
  isSignedIn: boolean;
};

/*
 * The cookie is the store. Nothing here caches it, so a token the middleware
 * renewed mid-visit is picked up the next time the browser gives us a reason to
 * look: the tab regaining focus, or becoming visible again. The flows that
 * change the session themselves (sign-in, sign-out, an email change) ask the
 * router to refresh, which re-renders the tree with the new cookie in place.
 */
const subscribe = (onSessionChange: () => void): (() => void) => {
  window.addEventListener('focus', onSessionChange);
  document.addEventListener('visibilitychange', onSessionChange);

  return () => {
    window.removeEventListener('focus', onSessionChange);
    document.removeEventListener('visibilitychange', onSessionChange);
  };
};

/*
 * On the server there is no readable cookie — a client component is rendered
 * without one — so the first paint is the signed-out one for everybody. That is
 * the safe direction to be wrong in: a signed-out visitor never sees a flash of
 * signed-in UI, and a member sees theirs appear on hydration.
 */
const signedOutSnapshot = (): string | null => null;

/**
 * Session state as the browser can see it. This is the one way client
 * components learn who is signed in; none of them read a cookie by hand, and
 * there is no session provider above them to read from either.
 */
export const useSession = (): SessionState => {
  const accessToken = useSyncExternalStore(subscribe, readAccessTokenCookie, signedOutSnapshot);

  return useMemo(() => {
    if (!accessToken) {
      return { session: null, isSignedIn: false };
    }

    return {
      session: { accessToken, user: readIdentityFromClaims(decodeAccessToken(accessToken)) },
      isSignedIn: true,
    };
  }, [accessToken]);
};
