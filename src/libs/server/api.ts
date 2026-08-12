'use server';

import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import { apiClient } from '../api-client';
import { ApiError } from '../api-error';

async function handleError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    redirect('/api/logout');
  }
}

export async function getApi() {
  const session = await auth();
  const client = apiClient(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || '', session);

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

    async post<T>(endpoint: string, body: Record<string, unknown> = {}, options?: Parameters<typeof client.post>[2]) {
      try {
        return await client.post<T>(endpoint, body, options);
      } catch (error) {
        return handleError(error);
      }
    },

    async put<T>(endpoint: string, body: Record<string, unknown>, options?: Parameters<typeof client.put>[2]) {
      try {
        return await client.put<T>(endpoint, body, options);
      } catch (error) {
        return handleError(error);
      }
    },

    async delete<T>(endpoint: string, options?: Parameters<typeof client.delete>[1]) {
      try {
        return await client.delete<T>(endpoint, options);
      } catch (error) {
        return handleError(error);
      }
    },
  };
}
