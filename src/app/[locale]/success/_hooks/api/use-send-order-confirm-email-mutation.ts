import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

export function useSendOrderConfirmEmailMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  async function sendOrderConfirmEmail() {
    return api.post('/user/send_order_confirm_email', {});
  }

  return useMutation({
    mutationFn: sendOrderConfirmEmail,
    onSuccess,
    onError,
  });
}
