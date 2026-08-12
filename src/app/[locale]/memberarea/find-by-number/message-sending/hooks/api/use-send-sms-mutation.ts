import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export function useSendSmsMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function sendSmsFunction(id: string) {
    return api.post(`/locations/${id}/sms`, {});
  }

  return useMutation({
    mutationFn: sendSmsFunction,
    onSuccess,
    onError,
  });
}
