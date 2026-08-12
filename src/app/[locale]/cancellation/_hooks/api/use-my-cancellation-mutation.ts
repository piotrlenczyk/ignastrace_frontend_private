import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Subscription } from '@/types/subscription';

import type { CancellationFormValues } from '../../_types/cancellation.types';

export function useCancellationMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function cancelSubscription(data: CancellationFormValues): Promise<Subscription> {
    return api.post('/public/subscriptions/cancel', {
      email: data.email,
    });
  }

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess,
    onError,
  });
}
