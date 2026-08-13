import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import { useSession } from '@/hooks/use-session';
import type { ApiError } from '@/libs/api-error';

export function useUpdateLocaleMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (locale: string) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();
  const { isSignedIn } = useSession();

  async function updateLocale(locale: string) {
    // A visitor with no account has nowhere to store a language preference; the
    // switch still works, it just does not outlive the visit.
    if (!isSignedIn) {
      return locale;
    }

    await api.put('/user', { locale });

    return locale;
  }

  return useMutation({
    mutationFn: updateLocale,
    onSuccess,
    onError,
  });
}
