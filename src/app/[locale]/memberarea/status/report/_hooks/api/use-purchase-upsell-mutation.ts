'use client';

import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export type PurchaseUpsellResponse = {
  sex_offender_search_report_id?: string;
};

export function usePurchaseUpsell({
  onSuccess,
  onError,
}: {
  onSuccess: (data: PurchaseUpsellResponse) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  async function purchaseUpsell({
    product,
    reverseLookupId = null,
    ownerId = null,
    sexOffenderSearchId = null,
    candidateIndex = null,
  }: {
    product: string;
    reverseLookupId?: string | null;
    ownerId?: string | null;
    sexOffenderSearchId?: string | null;
    candidateIndex?: number | null;
  }) {
    return api.post<PurchaseUpsellResponse>('/reverse_lookups_upsellings', {
      reverse_lookup_id: reverseLookupId,
      product,
      owner_id: ownerId,
      sex_offender_search_id: sexOffenderSearchId,
      candidate_index: candidateIndex,
    });
  }

  return useMutation({
    mutationFn: purchaseUpsell,
    onSuccess,
    onError,
  });
}
