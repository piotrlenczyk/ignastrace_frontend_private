import { signOut, useSession } from 'next-auth/react';

import { ROUTES } from '@/constants/routes';
import { apiClient } from '@/libs/api-client';
import { ApiError } from '@/libs/api-error';

async function handleError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    await signOut({ callbackUrl: ROUTES.SIGN_IN });
  }
}

export function useApi() {
  const { data: session } = useSession();
  const client = apiClient(process.env.NEXT_PUBLIC_API_URL || '', session);

  return {
    async request<T>(endpoint: string, options?: Parameters<typeof client.request>[1]) {
      try {
        return await client.request<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async get<T>(endpoint: string, options?: Parameters<typeof client.get>[1]) {
      try {
        return await client.get<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async post<T>(endpoint: string, body: Record<string, unknown>, options?: Parameters<typeof client.post>[2]) {
      try {
        return await client.post<T>(endpoint, body, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async put<T>(endpoint: string, body?: Record<string, unknown>, options?: Parameters<typeof client.put>[2]) {
      try {
        return await client.put<T>(endpoint, body ?? {}, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },

    async delete<T>(endpoint: string, options?: Parameters<typeof client.delete>[1]) {
      try {
        return await client.delete<T>(endpoint, options);
      } catch (error) {
        await handleError(error);
        throw error;
      }
    },
  };
}
