import { useMutation } from '@tanstack/react-query';
import type { User } from 'next-auth';
import { useSession } from 'next-auth/react';

import { useApi } from '@/hooks/use-api';
import { useCountry } from '@/hooks/useCountry';
import type { ApiError } from '@/libs/api-error';

import type { MyAccountFormValues } from '../../_types/my-account.types';

export function useMyAccountMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();
  const session = useSession();
  const country = useCountry();

  async function updateMyAccount(data: MyAccountFormValues) {
    const { authHeader } = await api.request<User>('/user', {
      method: 'PUT',
      body: {
        name: data.name,
        email: data.email,
        notify_status_changes: data.notify_status_changes,
        notify_user_located: data.notify_user_located,
        password: data.password,
        current_password: data.current_password,
        country,
      },
    });

    // When the email changes the authHeader needs to be updated
    await session.update({ apiToken: authHeader, email: data.email });
  }

  return useMutation({
    mutationFn: updateMyAccount,
    onSuccess,
    onError,
  });
}
