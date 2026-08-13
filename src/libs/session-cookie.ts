import { ACCESS_TOKEN_COOKIE_NAME } from '@/server/session/session.constants';

/**
 * The access token the server left for page scripts, or `null` when there is
 * none. This is the only part of the session a browser can see: the sealed
 * cookie beside it is http-only, and the tokens that could mint a new session
 * live in there.
 *
 * Read at the point of use rather than held anywhere, so a client never sends a
 * token the middleware has since replaced.
 */
export const readAccessTokenCookie = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${ACCESS_TOKEN_COOKIE_NAME}=`;
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) || null : null;
};
