import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { ReverseLookupCompact } from '@/types/reverse-lookup.types';

export function useCreateReverseLookupMutation({
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
