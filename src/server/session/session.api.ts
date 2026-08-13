import type { components } from '@/network/api/api';

type JWTSessionResponse = components['schemas']['JWTSessionResponse'];
type UserResponse = components['schemas']['UserResponse'];

/*
 * The session talks to the new API through plain `fetch` rather than the
 * generated client. The generated client resolves the caller's IP through a
 * request-scoped, server-only module, which is unavailable both in the
 * middleware runtime and to a sign-in that has no session yet.
 */
const apiUrl = (path: string): string => `${process.env.API_BASE_URL ?? ''}${path}`;

const authorized = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });

/**
 * What the generated client would otherwise derive from the request scope. In
 * the middleware runtime there is no such scope, so the caller reads both off
 * the incoming request and passes them in.
 */
export type ApiRequestContext = {
  locale?: string;
  forwardedFor?: string;
};

const contextHeaders = ({ locale, forwardedFor }: ApiRequestContext): Record<string, string> => ({
  ...(locale ? { 'x-locale': locale } : {}),
  ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
});

export class AuthApiError extends Error {
  constructor(readonly status: number) {
    super(`The authentication API responded with ${status}.`);
    this.name = 'AuthApiError';
  }
}

/** Exchanges credentials for a token pair. Throws `AuthApiError` when refused. */
export const requestLogin = async (email: string, password: string): Promise<JWTSessionResponse> => {
  const response = await fetch(apiUrl('/api/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new AuthApiError(response.status);
  }

  return (await response.json()) as JWTSessionResponse;
};

/**
 * Exchanges a refresh token for a fresh pair. Throws `AuthApiError` when the
 * refresh token is spent or rejected, which is the signal to stop treating the
 * visitor as signed in.
 */
export const requestTokenRefresh = async (
  refreshToken: string,
  context: ApiRequestContext = {},
): Promise<JWTSessionResponse> => {
  const response = await fetch(apiUrl('/api/v1/auth/refresh-token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...contextHeaders(context) },
    body: JSON.stringify({ refreshToken } satisfies components['schemas']['RefreshTokenDto']),
  });

  if (!response.ok) {
    throw new AuthApiError(response.status);
  }

  return (await response.json()) as JWTSessionResponse;
};

/** Revokes the token server-side. Callers treat a failure here as non-fatal. */
export const requestLogout = async (accessToken: string): Promise<void> => {
  const response = await fetch(apiUrl('/api/v1/auth/logout'), {
    method: 'POST',
    headers: authorized(accessToken),
  });

  if (!response.ok) {
    throw new AuthApiError(response.status);
  }
};

/** The identity the access token's claims did not carry. */
export const requestCurrentUser = async (accessToken: string): Promise<UserResponse | null> => {
  try {
    const response = await fetch(apiUrl('/api/v1/user/me'), {
      headers: authorized(accessToken),
    });

    return response.ok ? ((await response.json()) as UserResponse) : null;
  } catch {
    return null;
  }
};
