import type { components } from '@/network/api/api';
import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

import type { SessionData } from './session.types';

type JWTSessionResponse = components['schemas']['JWTSessionResponse'];
type UserResponse = components['schemas']['UserResponse'];

/*
 * Every auth call goes through the same generated client as the rest of the
 * application, typed against the specification and read through the shared
 * unwrapper — so a refusal arrives as the application's standard API error
 * carrying the API's own envelope, and there is no second description of an
 * auth request or response anywhere.
 *
 * See docs/adr/0010-one-client-for-the-auth-calls-too.md, which records why the
 * earlier hand-written requests are gone.
 */

const authorized = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });

/**
 * What the generated client would otherwise derive from the request scope. In
 * the middleware runtime there is no such scope, so the caller reads both off
 * the incoming request and passes them in. The client's headers are caller-wins,
 * which is what makes stating them here an override rather than a special case.
 */
export type ApiRequestContext = {
  locale?: string;
  forwardedFor?: string;
};

const contextHeaders = ({ locale, forwardedFor }: ApiRequestContext): Record<string, string> => ({
  ...(locale ? { 'x-locale': locale } : {}),
  ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
});

/** Exchanges credentials for a token pair. Rejects when the API refuses them. */
export const requestLogin = async (email: string, password: string): Promise<JWTSessionResponse> =>
  unwrapApiResponse(await apiServerClient['/api/v1/auth/login'].POST({ body: { email, password } }));

/**
 * Creates an account and returns the pair it is signed in with — the API issues
 * the password itself and mails it to the address, so there is nothing to send
 * beyond the email. Rejects when the API refuses; a `409` means taken.
 *
 * The locale is stated rather than left to the client because it decides which
 * language that mail is written in, and the caller knows which language the
 * visitor was reading.
 */
export const requestRegistration = async (
  email: string,
  context: ApiRequestContext = {},
): Promise<JWTSessionResponse> =>
  unwrapApiResponse(
    await apiServerClient['/api/v1/auth/register'].POST({
      body: { email },
      headers: contextHeaders(context),
    }),
  );

/**
 * Exchanges the session's refresh token for a fresh pair. Rejects when the
 * refresh token is spent or rejected, which is the signal to stop treating the
 * visitor as signed in.
 *
 * Three things are stated rather than left to the client. The bearer is the
 * session's *expired* access token, because the operation declares bearer or
 * API-key authentication and this application configures no API key — so the
 * only credential it has to present is the one that just ran out. The locale and
 * the caller's address are stated because the one caller is the middleware,
 * which runs before internationalisation has settled a locale and outside any
 * request scope the client could read an address from.
 */
export const requestTokenRefresh = async (
  { accessToken, refreshToken }: Pick<SessionData, 'accessToken' | 'refreshToken'>,
  context: ApiRequestContext = {},
): Promise<JWTSessionResponse> =>
  unwrapApiResponse(
    await apiServerClient['/api/v1/auth/refresh-token'].POST({
      body: { refreshToken },
      headers: { ...authorized(accessToken), ...contextHeaders(context) },
    }),
  );

/**
 * Revokes the token server-side. Callers treat a failure here as non-fatal.
 *
 * The bearer is stated because the token being revoked is the one the caller
 * holds, which is not necessarily the one the client would read back out of the
 * cookie it is in the middle of clearing.
 */
export const requestLogout = async (accessToken: string): Promise<void> => {
  await unwrapApiResponse(await apiServerClient['/api/v1/auth/logout'].POST({ headers: authorized(accessToken) }));
};

/**
 * The identity the access token's claims did not carry.
 *
 * The one call in this module that swallows a refusal: it runs while a session
 * is being assembled out of a pair the API has just issued, and an incomplete
 * identity is decided on by the caller rather than raised here. The bearer is
 * that brand-new token, which is not in a cookie yet for the client to find.
 */
export const requestCurrentUser = async (accessToken: string): Promise<UserResponse | null> => {
  try {
    return await unwrapApiResponse(await apiServerClient['/api/v1/user/me'].GET({ headers: authorized(accessToken) }));
  } catch {
    return null;
  }
};
