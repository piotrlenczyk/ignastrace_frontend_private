'use client';

import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export function useConsumeUpsell({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  async function consumeUpsell({
    reverseLookupId,
    product,
    ownerId = null,
  }: {
    reverseLookupId: string;
    product: string;
    ownerId?: string | null;
  }) {
    return api.post('/reverse_lookups_upsellings/consume', {
      reverse_lookup_id: reverseLookupId,
      product,
      owner_id: ownerId,
    });
  }

  return useMutation({
    mutationFn: consumeUpsell,
    onSuccess,
    onError,
  });
}
