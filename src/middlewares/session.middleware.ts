import type { NextRequest } from 'next/server';

import { readSession } from '@/server/session/session.cookies';
import type { SessionData } from '@/server/session/session.types';

/**
 * The session step of the middleware chain: unseals the session cookie the
 * request arrived with, so the steps after it decide on a session rather than
 * on a cookie. Renewing an expired access token belongs to this step and is
 * not implemented yet (issue #18).
 */
export const handleSession = async (request: NextRequest): Promise<SessionData | null> => readSession(request.cookies);
