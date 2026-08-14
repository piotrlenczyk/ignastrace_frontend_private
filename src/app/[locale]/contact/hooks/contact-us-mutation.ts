import { apiQueries } from '@/network/api/api-browser-client';

import type { ContactUsFormValues } from '../types/contact-form.types';

/**
 * The contact form's submission, through the proxy onto the new API.
 *
 * The path is a literal out of the generated specification, so the body this
 * takes and the failure it reports are both the API's own — `send` below is
 * where the form's values are checked against `ContactUsDto`.
 *
 * Nothing here reacts to a 401. The form is public and the API accepts it
 * anonymously; a caller behind the member area is the one that has to decide
 * what a dead session means for it.
 */
export function useContactUsMutation({ onSuccess, onError }: { onSuccess: () => void; onError: () => void }) {
  const { mutate, isPending } = apiQueries.useMutation('post', '/api/v1/support/contact-us', { onSuccess, onError });

  return {
    isPending,
    send: (values: ContactUsFormValues) => mutate({ body: values }),
  };
}
