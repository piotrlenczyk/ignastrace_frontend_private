import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';

import type { ContactUsFormValues } from '../types/contact-form.types';

export function useContactUsMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function sendContactUs(data: ContactUsFormValues) {
    return api.post('/contacts', data);
  }

  return useMutation({
    mutationFn: sendContactUs,
    onSuccess,
    onError,
  });
}
