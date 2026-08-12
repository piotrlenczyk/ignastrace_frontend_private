import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';

import type { LoginFormValues } from '@/app/[locale]/login/types/login.types';
import type { ApiError } from '@/libs/api-error';

async function loginFunction(data: LoginFormValues) {
  const response = await signIn('credentials', {
    email: data.email,
    password: data.password,
    redirect: false,
  });

  if (response?.error) {
    const error = { error: response.error };
    throw error;
  }
}

export function useLoginMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  return useMutation({
    mutationFn: loginFunction,
    onSuccess,
    onError,
  });
}
