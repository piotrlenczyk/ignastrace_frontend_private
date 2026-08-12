import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Subscription } from '@/types/subscription';

export function useReactivateSubscriptionMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (subscription: Subscription) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function reactivateSubscription(): Promise<Subscription> {
    return api.put('/subscription/reactivate');
  }

  return useMutation({
    mutationFn: reactivateSubscription,
    onSuccess,
    onError,
  });
}
