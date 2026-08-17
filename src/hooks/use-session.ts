'use client';

import { useContext } from 'react';

import { SessionContext, type SessionState } from '@/contexts/session-context';

export type { ClientSession, SessionState } from '@/contexts/session-context';

/**
 * Session state as the browser can see it: who is signed in, and nothing that
 * could be used to authenticate as them. This is the one way client components
 * learn about the session — none of them read a cookie or decode a token.
 */
export const useSession = (): SessionState => {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSession must be used inside a SessionProvider');
  }

  return context;
};
