import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Products } from '@/types/products';

export function useGetProduct({
  onSuccess,
  onError,
}: {
  onSuccess: (data: Products) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function getProduct(currency: string) {
    return api.get<Products>(`/products?currency=${currency}`);
  }

  return useMutation({
    mutationFn: getProduct,
    onSuccess,
    onError,
  });
}
