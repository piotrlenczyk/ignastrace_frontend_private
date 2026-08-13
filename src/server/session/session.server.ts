import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';

import { readSession } from './session.cookies';
import type { SessionData } from './session.types';

type GetSessionOptions = {
  /**
   * Send a visitor without a session to the login page instead of returning
   * `null`. For the screens that cannot render anything useful anonymously,
   * so that the caller is handed a session or nothing at all.
   */
  redirect?: boolean;
};

/**
 * The session the current request carries, or `null` for a visitor without
 * one. This is the one way server components, server actions and route
 * handlers read a session — nothing outside the session module unseals a
 * cookie for itself.
 *
 * The middleware guards a protected route before it renders, so a call here
 * asking to redirect is a second line rather than the first one.
 */
export async function getSession(options?: { redirect?: false }): Promise<SessionData | null>;
export async function getSession(options: { redirect: true }): Promise<SessionData>;
export async function getSession({ redirect: redirectWhenMissing = false }: GetSessionOptions = {}) {
  const session = await readSession(await cookies());

  if (!session && redirectWhenMissing) {
    redirect(ROUTES.SIGN_IN);
  }

  return session;
}
