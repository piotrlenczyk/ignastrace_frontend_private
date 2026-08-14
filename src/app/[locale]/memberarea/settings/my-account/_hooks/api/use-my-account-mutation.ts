import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/use-api';
import { useCountry } from '@/hooks/useCountry';
import type { ApiError } from '@/libs/api-error';
import { updateSessionEmail } from '@/server/session/session.actions';

import type { MyAccountFormValues } from '../../_types/my-account.types';

export function useMyAccountMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: ApiError) => void;
}) {
  const api = useApi();
  const country = useCountry();

  async function updateMyAccount(data: MyAccountFormValues) {
    await api.request('/user', {
      method: 'PUT',
      body: {
        name: data.name,
        email: data.email,
        notify_status_changes: data.notify_status_changes,
        notify_user_located: data.notify_user_located,
        password: data.password,
        current_password: data.current_password,
        country,
      },
    });

    /*
     * The address the session carries is the one the member just changed, so it
     * is written back before the form's success handler refreshes the router —
     * the refresh is what re-renders the tree with the rewritten cookie. The
     * tokens are untouched, so the member stays signed in.
     */
    await updateSessionEmail({ email: data.email });
  }

  return useMutation({
    mutationFn: updateMyAccount,
    onSuccess,
    onError,
  });
}
