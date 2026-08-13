import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/libs/api-client';
import { ApiError } from '@/libs/api-error';
import { readAccessTokenCookie } from '@/libs/session-cookie';
import { signOut } from '@/server/session/session.actions';

async function handleError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    await signOut();
    window.location.assign(ROUTES.SIGN_IN);
  }
}

/*
 * Built per call rather than per render, so the token that goes out is the one
 * in the cookie at that moment. The middleware can renew the session between a
 * component rendering and the member clicking something in it.
 */
function client() {
  const accessToken = readAccessTokenCookie();

  return apiClient(process.env.NEXT_PUBLIC_API_URL || '', accessToken && `Bearer ${accessToken}`);
}

type Client = ReturnType<typeof apiClient>;

export function useApi() {
  return {
    async request<T>(endpoint: string, options?: Parameters<Client['request']>[1]) {
      try {
        return await client().request<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async get<T>(endpoint: string, options?: Parameters<Client['get']>[1]) {
      try {
        return await client().get<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async post<T>(endpoint: string, body: Record<string, unknown>, options?: Parameters<Client['post']>[2]) {
      try {
        return await client().post<T>(endpoint, body, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async put<T>(endpoint: string, body?: Record<string, unknown>, options?: Parameters<Client['put']>[2]) {
      try {
        return await client().put<T>(endpoint, body ?? {}, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async delete<T>(endpoint: string, options?: Parameters<Client['delete']>[1]) {
      try {
        return await client().delete<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },
  };
}
