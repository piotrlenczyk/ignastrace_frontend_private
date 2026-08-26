'use client';

import { creditProductFor, type UpsellProductKey } from '@/libs/upsell-products';
import { useCurrentUserQuery } from '@/network/api/hooks/use-current-user-query';
import { upsellCreditCount, useUpsellCreditsQuery } from '@/network/api/hooks/use-upsell-credits-query';

/**
 * An upsell key this question can be asked about.
 *
 * **The standalone sex-offender search is excluded, and the compiler is what
 * enforces it.** The new API holds a credit balance for that key as it does for
 * the report-scoped three, but a balance there means something different: it says
 * how many candidate unlocks the member has left to spend, not which candidate is
 * open. A member holding two search credits owns no record at all, and a member
 * who has spent every one of theirs owns as many records as they bought. So "does
 * this member own this upsell" has no answer for that key, and asking it does not
 * compile rather than being answered plausibly and wrongly. ADR 0039 records it.
 */
export type OwnableUpsellKey = Exclude<UpsellProductKey, 'sex_offenders_search'>;

/**
 * Whether the member already has this upsell, read from whichever upstream
 * actually knows — and whether the answer is in yet.
 *
 * Two upstreams answer, because the two kinds of upsell are different things. For
 * the report-scoped products the new API models as a **credit balance**, having
 * one means a positive balance, and it is spent rather than bought again. For **unlimited
 * PDF downloads** it means the entitlement the new API publishes on the current
 * user, which is a member's own and nobody else's.
 *
 * What is deliberately not asked *here* is the payments service's
 * purchased-products endpoint. Every payments call is made as one shared
 * technical account, so its per-user answers are that account's: reading
 * ownership from there would make one member's purchase everybody's unlock. The
 * order-success screen does ask it, because its two extras exist in no other
 * upstream at all — one exception, with the cost accepted and recorded in
 * ADR 0032, and not a precedent for the keys this hook answers for.
 *
 * Nor is the composed member's list of extras asked any more. That list was
 * invented for every key except unlimited PDF downloads, so a screen deciding
 * whether to sell an upsell was reading an invented answer — the fixture ADR 0030
 * replaced and ADR 0038 deleted.
 *
 * `isLoading` is what a caller gates a purchase button on: false once the answer
 * is in, and false for a key neither upstream is asked about, so a button is
 * disabled only while there is genuinely an answer coming.
 */
export const useOwnsUpsell = (key: OwnableUpsellKey) => {
  const creditProduct = creditProductFor(key);
  const isEntitlement = key === 'unlimited_pdf_downloads';

  const { data: balances, isLoading: isLoadingBalances } = useUpsellCreditsQuery({ enabled: !!creditProduct });
  const { data: account, isLoading: isLoadingAccount } = useCurrentUserQuery();

  if (creditProduct) {
    return { ownsUpsell: upsellCreditCount(balances, creditProduct) > 0, isLoading: isLoadingBalances };
  }

  if (isEntitlement) {
    return { ownsUpsell: !!account?.unlimitedPdfDownloadsUnlocked, isLoading: isLoadingAccount };
  }

  /*
   * Neither upstream publishes ownership for the `/success` screen's two extras,
   * which are out of scope here. Saying "not owned" is what the screen that sells
   * them already assumes.
   */
  return { ownsUpsell: false, isLoading: false };
};
