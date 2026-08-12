import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { SexOffenderSearch } from '@/types/sex-offenders.types';

import type { SexOffenderSearchFormValues } from '../../types/search.types';

export function useCreateSexOffenderSearchMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (data: SexOffenderSearch) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function createSearch(data: SexOffenderSearchFormValues) {
    return api.post<SexOffenderSearch>('/sex_offender_searches', { ...data });
  }

  return useMutation({
    mutationFn: createSearch,
    onSuccess,
    onError,
  });
}
