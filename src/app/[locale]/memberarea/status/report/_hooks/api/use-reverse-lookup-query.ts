'use client';

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { ReverseLookup } from '@/types/reverse-lookup.types';

type Options = {
  refetchInterval?: number | false;
};

export function useReverseLookupQuery(id: string, { refetchInterval = false }: Options = {}) {
  const api = useApi();

  return useQuery<ReverseLookup, ApiError>({
    queryKey: ['reverse_lookup', id],
    queryFn: () => api.get<ReverseLookup>(`/reverse_lookups/${id}`),
    refetchInterval,
  });
}
