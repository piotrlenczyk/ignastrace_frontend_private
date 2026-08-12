import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';

import { useApi } from '@/hooks/use-api';
import { useCountry } from '@/hooks/useCountry';
import type { ApiError } from '@/libs/api-error';
import type { SignUpFormValues } from '@/types/sign-up.types';
import type { User } from '@/types/user';

export function useSignUpMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();
  const country = useCountry();

  async function signUpFunction(data: SignUpFormValues) {
    const { authHeader } = await api.request<User>('/users', {
      method: 'POST',
      body: {
        ...data,
        country,
      },
    });

    const signInResponse = await signIn('api-token', {
      apiToken: authHeader,
      redirect: false,
    });

    if (signInResponse?.error) {
      const error = { name: 'sign_in_error', error: signInResponse.error };
      throw error;
    }
  }

  return useMutation({
    mutationFn: signUpFunction,
    onSuccess,
    onError,
  });
}
