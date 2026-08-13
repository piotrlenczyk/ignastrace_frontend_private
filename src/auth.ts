import NextAuth, { type User } from 'next-auth';
import { AuthError } from 'next-auth';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';

import type { User as ApiUser } from '@/types/user';

import { getFunnelPhone } from './actions/funnel-phone-number';
import { ApiTokenProvider } from './auth-providers/api-token-provider';
import { CredentialsProvider } from './auth-providers/credentials-provider';
import { ROUTES } from './constants/routes';
import { getApi } from './libs/server/api';

declare module 'next-auth' {
  interface User extends ApiUser {
    apiToken: string;
  }

  interface Session {
    apiToken: string;
    user: {
      email: string;
      locale: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    idToken?: string;
    apiToken: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: ROUTES.SIGN_IN,
    error: ROUTES.SIGN_IN,
  },
  providers: [ApiTokenProvider, CredentialsProvider, Google, Facebook],
  callbacks: {
    jwt: async ({ token, user, session, account, trigger }) => {
      if (account?.access_token && account.provider === 'google') {
        user = await handleOAuthSignIn('google', account.access_token);
      }

      if (account?.access_token && account.provider === 'facebook') {
        user = await handleOAuthSignIn('facebook', account.access_token);
      }

      if (trigger === 'update') {
        return {
          ...token,
          apiToken: session.apiToken,
          email: session.email,
        };
      }

      if (!user) {
        return token;
      }

      return {
        ...token,
        apiToken: user.apiToken,
        email: user.email,
      };
    },
    session: ({ session, token }) => {
      return {
        ...session,
        apiToken: token.apiToken,
        user: {
          email: session.user.email,
          locale: session.user.locale,
        },
      };
    },
  },
});

async function handleOAuthSignIn(
  provider: string,
  accessToken: string,
): Promise<User> {
  try {
    const api = await getApi();
    const phoneNumber = await getFunnelPhone();

    const { data, authHeader } = await api.request<ApiUser>(
      `/oauth/${provider}`,
      {
        method: 'POST',
        body: {
          access_token: accessToken,
          onboarding_phone_number: phoneNumber,
        },
      },
    );

    if (!authHeader) {
      throw new AuthError(`Authentication failed with ${provider}`);
    }
    return { ...data, apiToken: authHeader };
  } catch (error) {
    console.error(error);
    throw new AuthError(`Authentication failed with ${provider}`, {
      cause: 'user_not_found',
    });
  }
}
// build
