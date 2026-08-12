import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Location } from '@/types/location';

import type { CreateLinkFormValues } from '../../types/create-link.types';

export function useCreateLinkLocationMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (data: Location) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function createLinkFunction(data: CreateLinkFormValues) {
    const fullData = {
      type: 'LinkLocation',
      name: data.name,
    };

    return api.post<Location>('/locations', fullData);
  }

  return useMutation({
    mutationFn: createLinkFunction,
    onSuccess,
    onError,
  });
}
