import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Carrier } from '@/types/carrier';

export function useCarrierQuery({
  phone,
}: {
  phone: string;
}) {
  const api = useApi();

  async function getCarrier() {
    const encodedPhone = encodeURIComponent(phone);
    const data = await api.get<Carrier>(`/carrier?phone=${encodedPhone}`);
    return data.carrier;
  }

  return useQuery<string, ApiError>({
    queryKey: ['carrier', phone],
    queryFn: getCarrier,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
