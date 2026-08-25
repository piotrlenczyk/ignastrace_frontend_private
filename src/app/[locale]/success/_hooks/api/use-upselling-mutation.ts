import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export function useUpsellingMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  async function createUpselling(products: string[]) {
    // Nothing selected is nothing to buy, so the screen just moves on.
    if (products.length === 0) {
      return;
    }

    return api.post('/upsellings', {
      products,
    });
  }

  return useMutation({
    mutationFn: createUpselling,
    onSuccess,
    onError,
  });
}
