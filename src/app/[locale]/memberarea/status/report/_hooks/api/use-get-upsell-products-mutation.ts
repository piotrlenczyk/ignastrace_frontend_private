import { useMutation } from '@tanstack/react-query';

import type { Product } from '@/app/[locale]/success/_types/product.type';
import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export function useGetUpsellProductsMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (products: Product[]) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function getUpsellProducts() {
    return api.get<Product[]>('/reverse_lookups_upsellings');
  }

  return useMutation({
    mutationFn: getUpsellProducts,
    onSuccess,
    onError,
  });
}
