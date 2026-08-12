import Credentials from 'next-auth/providers/credentials';

import { getApi } from '@/libs/server/api';
import type { User } from '@/types/user';

export const ApiTokenProvider = Credentials({
  id: 'api-token',
  name: 'API Token',
  type: 'credentials',
  credentials: {
    apiToken: { label: 'API Token', type: 'text' },
  },
  authorize: async (credentials) => {
    const api = await getApi();

    const { data, authHeader } = await api.request<User>('/user', {
      method: 'GET',
      headers: {
        Authorization: credentials.apiToken as string,
      },
    });

    if (!authHeader) {
      throw new Error('Invalid credentials.');
    }

    const user = {
      ...data,
      apiToken: authHeader,
    };

    return user;
  },
});
