import type { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getApi } from '@/libs/server/api';

export const CredentialsProvider = Credentials({
  authorize: async (credentials) => {
    const api = await getApi();

    const { data, authHeader } = await api.request<User>(
      '/users/sign_in',
      {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      },
    );

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
