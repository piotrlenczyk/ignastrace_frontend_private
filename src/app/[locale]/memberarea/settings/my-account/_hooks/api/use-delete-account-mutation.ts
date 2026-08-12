import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export function useDeleteAccountMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function deleteAccount() {
    return api.delete('/user');
  }

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess,
    onError,
  });
}
