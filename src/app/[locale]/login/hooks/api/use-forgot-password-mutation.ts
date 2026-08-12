import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

import type { ForgotPasswordFormValues } from '../../types/reset-password-form.types';

export function useForgotPasswordMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (email: string) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  async function forgotPasswordFunction(data: ForgotPasswordFormValues) {
    await api.post('/reset_password', data);

    return data.email;
  }

  return useMutation({
    mutationFn: forgotPasswordFunction,
    onSuccess,
    onError,
  });
}
