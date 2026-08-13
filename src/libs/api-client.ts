import type { Session } from 'next-auth';

import { ApiError } from './api-error';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export const apiClient = (baseUrl: string, session?: Session | null) => ({
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<{ data: T; authHeader?: string }> {
    const { method = 'GET', body, headers = {} } = options;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(session && { Authorization: session.apiToken }),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const textResponse = await response.text();
    const data = textResponse.length ? JSON.parse(textResponse) : {};

    const authHeader = response.headers.get('authorization');

    if (!response.ok) {
      throw new ApiError('An error occurred', response.status, data);
    }

    return { data, authHeader: authHeader ?? undefined };
  },

  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
    return response.data;
  },

  async post<T>(endpoint: string, body: Record<string, unknown>, options?: Omit<RequestOptions, 'method'>) {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
    return response?.data;
  },

  async put<T>(endpoint: string, body: Record<string, unknown>, options?: Omit<RequestOptions, 'method'>) {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
    return response.data;
  },

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>) {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
    return response.data;
  },
});

export const hasApiError = (error: ApiError, field: string, errorKey: string): boolean => {
  const errors = error.data?.errors;

  if (!errors || !errors[field]) {
    return false;
  }

  return errors[field].some((error) => error.error === errorKey);
};
