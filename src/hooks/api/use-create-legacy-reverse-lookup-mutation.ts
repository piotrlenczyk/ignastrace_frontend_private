import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { ReverseLookupCompact } from '@/types/reverse-lookup.types';

/**
 * Creates a reverse lookup on the legacy backend — the anonymous funnel's call,
 * and the last caller of `POST /reverse_lookups`.
 *
 * The member area's own creation moved to the new API; this did not. The two
 * screens that call it are the public funnel's checkout and the Stripe form it
 * renders, and everything a visitor sees after paying — the upsell screens, the
 * report, the PDF — reads the legacy backend. Moving this call would bet a paying
 * visitor's report on the storage assumption the member's flow now stands on,
 * which the record for that change ring-fenced them out of.
 *
 * It lives here rather than inside the member area because both its callers are
 * outside it; they used to reach across into the member screen's hooks directory
 * for the same call. It is named for the backend it talks to so that whoever
 * finishes retiring this family finds it by looking.
 */
export function useCreateLegacyReverseLookupMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (reverseLookup: ReverseLookupCompact) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function createReverseLookupFunction(phone: string) {
    return api.post<ReverseLookupCompact>('/reverse_lookups', { phone });
  }

  return useMutation({
    mutationFn: createReverseLookupFunction,
    onSuccess,
    onError,
  });
}
