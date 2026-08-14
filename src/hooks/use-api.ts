import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/libs/api-client';
import { ApiError } from '@/libs/api-error';
import { LEGACY_PROXY_BASE_PATH } from '@/network/legacy/legacy-proxy-path';
import { signOut } from '@/server/session/session.actions';

async function handleError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    await signOut();
    window.location.assign(ROUTES.SIGN_IN);
  }
}

/*
 * Aimed at this application's own origin rather than at the legacy backend, and
 * carrying no credential of its own: the proxy behind that path attaches the
 * session's bearer server-side, so a page script never holds one. That is also
 * why one client for the whole module is enough — there is no longer a token
 * whose freshness a per-call rebuild had to keep up with.
 */
const client = apiClient(LEGACY_PROXY_BASE_PATH);

type Client = ReturnType<typeof apiClient>;

export function useApi() {
  return {
    async request<T>(endpoint: string, options?: Parameters<Client['request']>[1]) {
      try {
        return await client.request<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async get<T>(endpoint: string, options?: Parameters<Client['get']>[1]) {
      try {
        return await client.get<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async post<T>(endpoint: string, body: Record<string, unknown>, options?: Parameters<Client['post']>[2]) {
      try {
        return await client.post<T>(endpoint, body, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async put<T>(endpoint: string, body?: Record<string, unknown>, options?: Parameters<Client['put']>[2]) {
      try {
        return await client.put<T>(endpoint, body ?? {}, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async delete<T>(endpoint: string, options?: Parameters<Client['delete']>[1]) {
      try {
        return await client.delete<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },
  };
}
