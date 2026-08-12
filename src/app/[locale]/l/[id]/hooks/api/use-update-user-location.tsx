import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Location } from '@/types/location';

export const LOCATION_STATUS = {
  APPROVED: 'located',
  REJECTED: 'rejected',
};

type ApprovedParams = Pick<Location, 'address' | 'id' | 'lat' | 'lon'> & {
  status: typeof LOCATION_STATUS['APPROVED'];
};
type RejectedParams = Pick<Location, 'id'> & {
  address?: never;
  lat?: never;
  lon?: never;
  status: typeof LOCATION_STATUS['REJECTED'];
};

export function useUpdateUserLocation({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: Location) => void;
  onError?: (error: ApiError) => void;
}) {
  const api = useApi();

  function updateUserLocationFunction({ address, id, lat, lon, status }: ApprovedParams | RejectedParams) {
    const requestBody = status === LOCATION_STATUS.APPROVED ? { address, lat, lon, status } : { status };

    return api.put<Location>(`/locations/${id}`, requestBody);
  }

  return useMutation({
    mutationFn: updateUserLocationFunction,
    onSuccess,
    onError,
  });
}
