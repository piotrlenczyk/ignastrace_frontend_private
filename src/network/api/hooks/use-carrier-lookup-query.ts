'use client';

import { formatPhoneNumber } from '@/hooks/format-phone-number';

import { $api } from '../api-browser-client';

/**
 * The carrier behind a phone number, read through the proxy and typed from the
 * generated specification.
 *
 * It is one hook rather than one per screen because the searching screen and the
 * summary screen ask the same question about the same number: the generated query
 * key carries the method, the path and the request body, so the second screen
 * reads the first screen's answer out of the cache instead of asking again. That
 * is also why `staleTime` and `gcTime` are infinite — a number's carrier does not
 * change while somebody walks through a funnel.
 *
 * The endpoint is a `POST` and this is a `useQuery`: the verb is the API's, the
 * semantics are a lookup, and nothing here writes anything.
 *
 * A failure is deliberately unhandled. The carrier name is a cosmetic field with
 * a working fallback on both screens, so a dead vendor call must not interrupt
 * the funnel with a toast or a dialog.
 *
 * The whole response is returned rather than the carrier string alone, so the
 * hook's type does not drift from the endpoint it is named after.
 */
export const useCarrierLookupQuery = (phoneNumber: string) =>
  $api.useQuery(
    'post',
    '/api/v1/carrier-lookup',
    { body: { phoneNumber } },
    {
      /*
       * Only a number that parses is worth asking about. The summary route admits
       * any non-empty number where the searching routes admit only a valid one,
       * and the specification declares no 400 for this operation — so an
       * unparseable number would come back in a shape the generated types do not
       * describe. Not sending it keeps the application away from that case; the
       * screens render their fallback either way.
       */
      enabled: formatPhoneNumber(phoneNumber).valid,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  );
