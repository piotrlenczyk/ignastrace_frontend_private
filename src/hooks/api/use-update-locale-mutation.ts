import { useMutation } from '@tanstack/react-query';
import type { User } from 'next-auth';
import { useSession } from 'next-auth/react';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export function useUpdateLocaleMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (locale: string) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();
  const session = useSession();

  async function updateLocale(locale: string) {
    if (!session.data?.user) {
      return locale;
    }

    await api.put<User>('/user', { locale });

    return locale;
  }

  return useMutation({
    mutationFn: updateLocale,
    onSuccess,
    onError,
  });
}
