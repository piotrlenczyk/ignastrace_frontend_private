import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Subscription } from '@/types/subscription';

export function useCancelSubscriptionMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function cancelSubscription(): Promise<Subscription> {
    return api.delete('/subscription');
  }

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess,
    onError,
  });
}
