import type { components as apiComponents } from '@/network/api/api';

/**
 * The order of operations around an upsell purchase, and the only place it
 * lives.
 *
 * Four call sites unlock an upsell — the member area's data-breach, sex-offender
 * and social-network sections through one dialog, the unlimited-download dialog,
 * and the three funnel steps — and every one of them moves money. So the
 * sequence is one function with its operations handed to it: no network, no
 * React, no session inside, and every case reachable from a test with plain
 * fakes. This follows `resolveUpsellProduct`'s precedent, which is the seam ADR
 * 0029 added for the same reason.
 *
 * See `docs/adr/0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md`.
 */

/** What an attempt to spend a credit can answer. */
export type SpendOutcome =
  /** The credit was spent and the section is unlocked. */
  | 'spent'
  /** The caller holds no credit of this product — the one refusal that leads to a purchase. */
  | 'no-credit'
  /** Anything else the new API refused with. Never leads to a purchase. */
  | 'refused';

/** What an attempt to buy on the payments service can answer. */
export type PurchaseOutcome =
  /** The charge went through outright; nothing more is asked of the cardholder. */
  | { status: 'purchased' }
  /** The provider wants the cardholder present, and this is the credential to do it with. */
  | { status: 'confirmation-required'; clientSecret: string }
  /** Declined, refused, or unreachable. */
  | { status: 'refused' };

/** What an attempt to confirm a charge in the browser can answer. */
export type ConfirmationOutcome =
  /** The cardholder passed the challenge. */
  | 'confirmed'
  /** The challenge was failed or dismissed. */
  | 'refused'
  /**
   * There is no instance to confirm on. A client secret arrived for a provider
   * this application cannot present a challenge for — Adyen and NMI have no
   * confirmation path here — and that is a failed purchase rather than a silent
   * success.
   */
  | 'unavailable';

/** The new API's name for a product it holds a credit balance for. */
export type CreditProduct = apiComponents['schemas']['ConsumeUpsellDto']['product'];

/** Which credit is being spent, against which report, and for which owner. */
export type SpendRequest = {
  product: CreditProduct;
  reportId: string;
  /** Required for `SEX_OFFENDERS`, and forbidden for every other product. */
  ownerId?: string;
};

/**
 * The three operations the sequence is composed of. Each is handed in, so the
 * rule below is driven from a test without a network.
 */
export type UnlockOperations = {
  spend: (request: SpendRequest) => Promise<SpendOutcome>;
  buy: (priceId: string) => Promise<PurchaseOutcome>;
  confirm: (clientSecret: string) => Promise<ConfirmationOutcome>;
};

/** What a caller acts on. */
export type UnlockOutcome =
  /** The section is unlocked: a credit was spent, whether or not one was bought first. */
  | { outcome: 'unlocked' }
  /** The charge did not go through. Nothing was spent and nothing is owed. */
  | { outcome: 'purchase-failed' }
  /** The charge needs the cardholder, and the challenge was failed, dismissed or impossible. */
  | { outcome: 'confirmation-failed' }
  /**
   * The new API refused the spend for a reason other than an empty balance, or
   * refused the credit that had just been bought. The second case is the symptom
   * ADR 0030 names: a charge that succeeded while the section stayed locked.
   */
  | { outcome: 'spend-refused' };

/** What a purchase with no credit behind it — unlimited PDF downloads, a funnel step — answers. */
export type PurchaseResult =
  { outcome: 'purchased' } | { outcome: 'purchase-failed' } | { outcome: 'confirmation-failed' };

/**
 * Buys one upsell on the payments service, seeing through the confirmation the
 * provider may ask for.
 *
 * The price identifier is the one off the resolved payments row, which is the
 * same row whose amount was displayed: the amount charged and the amount shown
 * are the same number read off the same record.
 *
 * This is the whole of what a funnel step does — at that moment no report exists
 * to spend a credit against, so the credit waits on the member's balance — and
 * the whole of what unlimited PDF downloads does, which the new API models as an
 * entitlement rather than as a balance.
 */
export const buyUpsell = async (
  priceId: string,
  { buy, confirm }: Pick<UnlockOperations, 'buy' | 'confirm'>,
): Promise<PurchaseResult> => {
  const purchase = await buy(priceId);

  if (purchase.status === 'refused') {
    return { outcome: 'purchase-failed' };
  }

  if (purchase.status === 'confirmation-required') {
    return (await confirm(purchase.clientSecret)) === 'confirmed'
      ? { outcome: 'purchased' }
      : { outcome: 'confirmation-failed' };
  }

  return { outcome: 'purchased' };
};

/**
 * Unlocks a report section the new API models as a credit balance, spending a
 * credit and buying one first only where none is left.
 *
 * **Spend first.** A member who already holds a credit is never charged again,
 * whatever the balance a screen read a moment ago said — so the offer a stale
 * balance produced cannot take money twice. Only the one refusal that means "you
 * have none of these" leads to a purchase; every other refusal is a failure that
 * costs nothing, because a spend that failed for some other reason would not
 * start succeeding once a credit was bought.
 *
 * The backend grants the credit itself, listening to the payments service, which
 * is why the purchase is followed by a second spend and not by a grant of any
 * kind here. A second spend that is refused means the credit did not arrive: the
 * member has been charged and the section is still locked, which is stated as an
 * outcome rather than retried.
 */
export const unlockUpsellWithCredit = async (
  request: SpendRequest,
  priceId: string,
  operations: UnlockOperations,
): Promise<UnlockOutcome> => {
  const firstSpend = await operations.spend(request);

  if (firstSpend === 'spent') {
    return { outcome: 'unlocked' };
  }

  if (firstSpend === 'refused') {
    return { outcome: 'spend-refused' };
  }

  const purchase = await buyUpsell(priceId, operations);

  if (purchase.outcome !== 'purchased') {
    return { outcome: purchase.outcome };
  }

  return (await operations.spend(request)) === 'spent' ? { outcome: 'unlocked' } : { outcome: 'spend-refused' };
};

/**
 * The error code the new API refuses a spend with when the caller simply has no
 * credit of that product left — the one refusal `unlockUpsellWithCredit` turns
 * into a purchase.
 *
 * **Read from the API's code union rather than from its documentation, which
 * declares only 401 and 403 for this operation.** `UPSELL_REQUIRED_ERROR` names
 * exactly this condition: an upsell is required, which is what "you hold no
 * credit" is in that vocabulary.
 *
 * **One code, deliberately, and `ENTITY_NOT_FOUND_ERROR` is not it.** That code
 * is the tempting second candidate and the dangerous one: the entity named in a
 * consume request is the *report*, so it far more plausibly means "not your
 * report" than "no credit". Reading it as an empty balance would charge a member
 * whose spend failed for an unrelated reason and then fail the second spend —
 * precisely the charge-with-no-credit this sequence exists to prevent.
 *
 * So the list errs towards not charging. If the backend turns out to refuse an
 * empty balance with some other code, the symptom is loud and costs nothing: the
 * dialog reports a failed payment without any money moving, and the fix is one
 * entry here. ADR 0030 records both directions.
 */
const EMPTY_BALANCE_ERROR_CODES: readonly string[] = ['UPSELL_REQUIRED_ERROR'];

/**
 * Whether a refusal of the spend says the caller has no credit left, as opposed
 * to saying something went wrong.
 *
 * The refusal arrives at a query-library mutation as the body the API refused
 * with — no status, no `HttpClientError` — so it is read out of the envelope's
 * own `errorCode`. Anything that is not that envelope is not an empty balance: a
 * gateway's HTML, or the proxy's own refusal in the same envelope under a
 * `PROXY_*` code, says nothing about a balance, and guessing at it here would
 * raise a charge on a member whose spend failed for an unrelated reason.
 */
export const isEmptyCreditBalance = (refusal: unknown): boolean => {
  if (typeof refusal !== 'object' || refusal === null) {
    return false;
  }

  const { error } = refusal as { error?: unknown };

  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { errorCode } = error as { errorCode?: unknown };

  return typeof errorCode === 'string' && EMPTY_BALANCE_ERROR_CODES.includes(errorCode);
};
