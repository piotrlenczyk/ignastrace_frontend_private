'use client';

import { $api } from '@/network/api/api-browser-client';

/**
 * Creates a reverse-lookup report for a phone number, through the proxy and typed
 * from the generated specification.
 *
 * Two screens call it, on either side of the member-area boundary: the member's
 * phone-lookup form, and the public reverse-lookup funnel's checkout once a payment
 * has succeeded. It lives among the shared hooks for that reason — the place the
 * legacy wrapper it replaced occupied, and for the same reason that one was put
 * there: a screen should not reach into another screen's hooks directory for a call
 * that is not about that screen.
 *
 * A mutation rather than a server action because none of the three things that
 * make a write an action holds: it sets no cookie of its own, redirects nothing
 * server-side, and invalidates no Next cache. The funnel phone number is saved by
 * a separate action with other callers, and the navigation that follows is the
 * caller's, in the browser.
 *
 * A caller states a phone number and hears back an identifier or a refusal, so the
 * API's request shape stops here rather than being written out at the call site.
 * Only the identifier is passed on: the response also carries a status and the
 * carrier and line type the API captured synchronously, and none of it is read.
 * The screen the member lands on counts down an animation and then offers the
 * report, exactly as it did on the legacy call, and showing the carrier there
 * would be a new capability on a screen awaiting redesign rather than a migration.
 * The funnel reads even less — it discards the identifier too.
 *
 * A refusal is handed on as the envelope the API refused in — and as that alone,
 * without the submitted variables and the query-library context that travel beside
 * it — for the caller to recognise by the API's own error code. Recognising one is
 * the member screen's business: the funnel branches on nothing and carries a
 * visitor onward whatever the answer.
 */
export const useCreateReverseLookupMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess: (reportId: string) => void;
  onError: (refusal: unknown) => void;
}) => {
  const { mutate } = $api.useMutation('post', '/api/v1/reverse-lookup-reports', {
    onSuccess: ({ id }) => onSuccess(id),
    onError: (refusal) => onError(refusal),
  });

  return { mutate: (phoneNumber: string) => mutate({ body: { phoneNumber } }) };
};
