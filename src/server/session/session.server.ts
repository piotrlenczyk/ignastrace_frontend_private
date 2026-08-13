import { cookies } from 'next/headers';

import { readSession } from './session.cookies';
import type { SessionData } from './session.types';

/**
 * The session the current request carries, or `null` for a visitor without
 * one. This is the one way server components, server actions and route
 * handlers read a session — nothing outside the session module unseals a
 * cookie for itself.
 */
export const getSession = async (): Promise<SessionData | null> => readSession(await cookies());
