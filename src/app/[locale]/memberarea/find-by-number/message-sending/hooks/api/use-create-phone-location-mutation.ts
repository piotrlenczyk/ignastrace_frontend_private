import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import type { ApiError } from '@/libs/api-error';
import type { Location } from '@/types/location';

import type { MessageSendingFormValues } from '../../types/message-sending.types';

export function useCreatePhoneLocationMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (data: Location) => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();

  function createPhoneLocationFunction(data: MessageSendingFormValues) {
    const fullData = {
      type: 'PhoneLocation',
      message: data.message,
      phone: data.phone,
    };

    return api.post<Location>('/locations', fullData);
  }

  return useMutation({
    mutationFn: createPhoneLocationFunction,
    onSuccess,
    onError,
  });
}
