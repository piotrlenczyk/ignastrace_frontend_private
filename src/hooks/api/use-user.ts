import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { User } from '@/types/user';

export function useGetUser() {
  const api = useApi();

  async function getUser() {
    return api.get<User>('/user');
  }

  return useQuery<User, ApiError>({
    queryKey: ['user'],
    queryFn: getUser,
    staleTime: 0,
    gcTime: 0,
  });
}
