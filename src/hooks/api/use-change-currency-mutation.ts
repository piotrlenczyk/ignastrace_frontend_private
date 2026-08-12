import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { SubscriptionIntent } from '@/types/subscription-intent';

export function useChangeCurrencyMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (data: SubscriptionIntent) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function changeCurrency(currency: string) {
    return api.post<SubscriptionIntent>('/subscription', { currency });
  }

  return useMutation({
    mutationFn: changeCurrency,
    onSuccess,
    onError,
  });
}
