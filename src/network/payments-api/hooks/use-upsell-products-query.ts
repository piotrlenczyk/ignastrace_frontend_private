'use client';

import { $paymentsApi } from '../payments-api-browser-client';

/**
 * The upsell products the payments service offers the caller.
 *
 * A **query**, which is the whole of what it is: the member area's unlock dialog
 * used to fire this read as a mutation out of a mount effect, through the legacy
 * browser client, and cache nothing. Reading it as a query is what the rest of
 * this application does with a read.
 *
 * The operation takes no parameters: the service answers for whichever session
 * is behind the proxy's cookie — which, while ADR 0023 stands, is one shared
 * technical account's. What comes back is the whole upsell catalogue; picking a
 * product out of it is `resolveUpsellProduct`'s job, not a call site's.
 *
 * `staleTime` and `gcTime` are infinite, for the reason the carrier lookup gives
 * and one of its own. A catalogue does not change while somebody reads a report,
 * so the several dialogs mounted on one screen share a single request for the
 * life of the page instead of each asking. And an offer, once made, is not
 * withdrawn underneath the member: without this, a window refocus mid-purchase
 * could refetch a catalogue that no longer lists the product being bought — the
 * exact shape ADR 0029's unconfirmed assumption about `/products/upsell` would
 * take — and unmount the dialog reporting the charge.
 *
 * There is no handler for a refusal here. The dialog treats one exactly as it
 * treats a catalogue with no matching row — it does not render — so a failure
 * needs no branch of its own.
 */
export const useUpsellProductsQuery = () =>
  $paymentsApi.useQuery('get', '/products/upsell', {}, { staleTime: Infinity, gcTime: Infinity });
