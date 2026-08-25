'use client';

import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

/**
 * What the legacy purchase answers the standalone search with: the search report
 * it created, which is the reason this one call did not follow every other
 * upselling purchase onto the payments service. See ADR 0030.
 */
export type PurchaseUpsellResponse = {
  sex_offender_search_report_id?: string;
};

/**
 * Buys the standalone sex-offender search on the legacy catalogue.
 *
 * A legacy call on purpose, and the last upselling purchase that is one. It moved
 * here from the report screens' hook directory with the one caller that still
 * needs it; the other four upsells buy on the payments service.
 */
export function usePurchaseUpsell({
  onSuccess,
  onError,
}: {
  onSuccess: (data: PurchaseUpsellResponse) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  async function purchaseUpsell({
    sexOffenderSearchId,
    candidateIndex,
  }: {
    sexOffenderSearchId: string;
    candidateIndex: number;
  }) {
    return api.post<PurchaseUpsellResponse>('/reverse_lookups_upsellings', {
      reverse_lookup_id: null,
      product: 'sex_offenders_search',
      owner_id: null,
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
