'use client';

import { useSession } from '@/hooks/use-session';
import type { CreditProduct } from '@/libs/upsell-unlock';

import type { components as apiComponents } from '../api';
import { $api } from '../api-browser-client';

/** The generated key this query is cached under, for invalidating it after a spend. */
export const UPSELL_CREDITS_QUERY_KEY = $api.queryOptions(
  'get',
  '/api/v1/reverse-lookup-upsellings/credits',
  {},
).queryKey;

/**
 * How many credits of each product the caller may still spend.
 *
 * This is what decides "offer the unlock" against "offer the purchase", and it is
 * the answer that replaces a fixture: the composed member's list of extras is the
 * mocked membership of ADR 0013 for every key but unlimited PDF downloads, so a
 * funnel step or a report section asking it was asking an invented question.
 *
 * It answers for the three products the new API models as a balance. The
 * payments service's own purchased-products endpoint is deliberately not used
 * instead: every payments call is made as one shared technical account, so its
 * per-user answers are that account's, and reading ownership from them would make
 * one member's purchase everybody's unlock.
 *
 * Not pinned, unlike the catalogue read beside it. A balance is exactly the thing
 * that changes while somebody reads a report — every spend and every purchase
 * moves it — so it is refetched on the ordinary schedule and invalidated at the
 * call site after a spend.
 *
 * Gated on the session for the reason the current-user read gives: anonymous
 * there is no balance to fetch and the endpoint says so with a 401.
 */
export const useUpsellCreditsQuery = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { isSignedIn } = useSession();

  return $api.useQuery('get', '/api/v1/reverse-lookup-upsellings/credits', {}, { enabled: isSignedIn && enabled });
};

/**
 * How many credits of one product a set of balances carries.
 *
 * A product the response does not mention has none — the endpoint answers with a
 * row per product the caller holds something of, so absence is a zero here rather
 * than the "unknown" an absent count means elsewhere on the report.
 */
export const upsellCreditCount = (
  balances: apiComponents['schemas']['UpsellCreditSummaryResponse'][] | undefined,
  product: CreditProduct,
): number => balances?.find((balance) => balance.product === product)?.count ?? 0;
