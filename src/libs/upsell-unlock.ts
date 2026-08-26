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
 * See `docs/adr/0030-the-upsell-charge-follows-the-price-and-the-credit-is-spent-on-the-new-api.md`
 * and `docs/adr/0031-spend-versus-buy-is-settled-from-the-credit-balance.md`.
 */

/**
 * What an attempt to spend a credit can answer.
 *
 * An object union rather than three words, because one of the three answers
 * carries something: the standalone search's spend materialises the report it
 * unlocks and names it back, and that identifier is born inside the operation.
 * Every answer in this module is shaped this way now — an operation says
 * `status`, a sequence below says `outcome` — so nothing has to be captured
 * beside the rule to get out of it.
 */
export type SpendOutcome =
  /**
   * The credit was spent and the section is unlocked. `searchReportId` is the
   * report the spend just materialised, which only `SEX_OFFENDERS_SEARCH` has:
   * every other product spends against a report that already exists.
   */
  | { status: 'spent'; searchReportId?: string }
  /**
   * The new API refused with a conflict, which it uses for two opposite
   * conditions — an empty balance and content that is already unlocked — under
   * one status, one error code and one message. So this says nothing on its own;
   * the balance is what tells the two apart.
   */
  | { status: 'conflict' }
  /** Anything else the new API refused with. Never leads to a purchase. */
  | { status: 'refused' };

/**
 * How many credits of a product the caller holds, or that it could not be read.
 *
 * `'unknown'` is not a zero. A charge is raised only behind a number, so a read
 * that failed refuses the unlock rather than guessing at the member's card.
 */
export type CreditBalance = number | 'unknown';

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

/**
 * Which credit is being spent, and what it is spent against.
 *
 * A union over the product rather than one shape with optional fields, because
 * the new API's rules about those fields are per-product and absolute: it forbids
 * a report identifier for `SEX_OFFENDERS_SEARCH` and requires a search and a
 * candidate index instead, and forbids those two everywhere else. Stated as one
 * shape, an illegal combination compiles and the upstream rejects it at runtime;
 * stated as this, it does not compile at all.
 *
 * The four members are the four products of `CreditProduct`, which the assertion
 * below keeps them exhaustive over.
 */
export type SpendRequest =
  /** The two report-scoped products, spent against a report the caller owns. */
  | { product: 'DATA_LEAKS' | 'SOCIAL_NETWORKS'; reportId: string }
  /** Gated per report owner, so the owner travels with the credit. */
  | { product: 'SEX_OFFENDERS'; reportId: string; ownerId: string }
  /** The standalone search, which is not report-scoped: no report exists yet to name. */
  | { product: 'SEX_OFFENDERS_SEARCH'; searchId: string; candidateIndex: number };

/**
 * Every product the new API holds a balance for is named by one of the requests
 * above. A fifth arriving in the generated union is a build failure on this line
 * rather than an unlock nobody can ask for.
 */
type EveryCreditProductIsSpendable = Exclude<CreditProduct, SpendRequest['product']> extends never ? true : never;

const _spendableProductsAreExhaustive: EveryCreditProductIsSpendable = true;

/**
 * The four operations the sequence is composed of. Each is handed in, so the
 * rule below is driven from a test without a network.
 */
export type UnlockOperations = {
  spend: (request: SpendRequest) => Promise<SpendOutcome>;
  /**
   * The member's balance of one credit product, read fresh. This is what a
   * conflict is settled from, so a stale number is exactly what it must not
   * answer with.
   */
  readBalance: (product: CreditProduct) => Promise<CreditBalance>;
  buy: (priceId: string) => Promise<PurchaseOutcome>;
  confirm: (clientSecret: string) => Promise<ConfirmationOutcome>;
};

/**
 * What a spend answers once a conflict has been settled — the section's own
 * unlock button's vocabulary, and the branch point of the sequence below.
 */
export type SettledSpend =
  /**
   * The section is open: the credit was spent, or it was already unlocked. Only a
   * spend that actually happened can name a report it materialised, so an unlock
   * inferred from the balance names none.
   */
  | { outcome: 'unlocked'; searchReportId?: string }
  /** The balance is empty, so a purchase is what would open the section. */
  | { outcome: 'no-credit' }
  /** The spend failed, and nothing about the balance is known. Never leads to a purchase. */
  | { outcome: 'refused' };

/** What a caller acts on. */
export type UnlockOutcome =
  /**
   * The section is unlocked: a credit was spent, whether or not one was bought
   * first. `searchReportId` names the report the standalone search's spend
   * materialised, and is the only thing a caller cannot find out any other way.
   */
  | { outcome: 'unlocked'; searchReportId?: string }
  /** The charge did not go through. Nothing was spent and nothing is owed. */
  | { outcome: 'purchase-failed' }
  /** The charge needs the cardholder, and the challenge was failed, dismissed or impossible. */
  | { outcome: 'confirmation-failed' }
  /**
   * The new API refused the spend for a reason that says nothing about the
   * balance, or refused the credit that had just been bought. The second case is
   * the symptom ADR 0030 names: a charge that succeeded while the section stayed
   * locked.
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
 * Spends a credit and says what that spend meant, resolving the one refusal that
 * carries two opposite meanings.
 *
 * The new API answers a spend it will not perform with a conflict, and it uses
 * that same conflict both for a balance with nothing left in it and for content
 * that is already unlocked — identical status, identical error code, identical
 * message, and only a free-text sentence in `details` to tell them apart. Nothing
 * here reads that sentence. The balance is re-read instead, and the API's own
 * number settles it:
 *
 * - **more than zero** — the conflict cannot have meant an empty balance, so the
 *   content is already unlocked and nothing needs buying;
 * - **zero** — the balance is genuinely empty, and a purchase is what would open
 *   the section;
 * - **unreadable** — nothing is inferred. The attempt failed, and no charge may
 *   follow from a balance nobody could read.
 *
 * This is the whole of what a section's own unlock button does, and the first
 * step of `unlockUpsellWithCredit`, so the rule lives once and both entry points
 * reach it.
 */
export const spendUpsellCredit = async (
  request: SpendRequest,
  { spend, readBalance }: Pick<UnlockOperations, 'spend' | 'readBalance'>,
): Promise<SettledSpend> => {
  const outcome = await spend(request);

  if (outcome.status === 'spent') {
    return { outcome: 'unlocked', searchReportId: outcome.searchReportId };
  }

  if (outcome.status === 'refused') {
    return { outcome: 'refused' };
  }

  const balance = await readBalance(request.product);

  if (balance === 'unknown') {
    return { outcome: 'refused' };
  }

  return balance > 0 ? { outcome: 'unlocked' } : { outcome: 'no-credit' };
};

/**
 * Unlocks a report section the new API models as a credit balance, spending a
 * credit and buying one first only where the balance is empty.
 *
 * **Spend first.** A member who already holds a credit is never charged again,
 * whatever the balance a screen read a moment ago said — so the offer a stale
 * balance produced cannot take money twice. Only a fresh reading of zero leads to
 * a purchase; a spend that failed for any other reason is a failure that costs
 * nothing, because it would not start succeeding once a credit was bought.
 *
 * The backend grants the credit itself, listening to the payments service, which
 * is why the purchase is followed by a second spend and not by a grant of any
 * kind here. That second spend is attempted once and its answer is final: a
 * conflict there is not put back through the balance, because after a purchase
 * anything other than a spent credit means the member has been charged and the
 * section is still locked — which is stated as an outcome rather than retried.
 */
export const unlockUpsellWithCredit = async (
  request: SpendRequest,
  priceId: string,
  operations: UnlockOperations,
): Promise<UnlockOutcome> => {
  const firstSpend = await spendUpsellCredit(request, operations);

  if (firstSpend.outcome === 'unlocked') {
    return { outcome: 'unlocked', searchReportId: firstSpend.searchReportId };
  }

  if (firstSpend.outcome === 'refused') {
    return { outcome: 'spend-refused' };
  }

  const purchase = await buyUpsell(priceId, operations);

  if (purchase.outcome !== 'purchased') {
    return { outcome: purchase.outcome };
  }

  const secondSpend = await operations.spend(request);

  return secondSpend.status === 'spent'
    ? { outcome: 'unlocked', searchReportId: secondSpend.searchReportId }
    : { outcome: 'spend-refused' };
};

/**
 * Whether a refusal of the spend is the conflict the new API answers both of its
 * two "will not spend" conditions with.
 *
 * The refusal arrives at a query-library mutation as the body the API refused
 * with — no status, no `HttpClientError` — but that envelope states the status as
 * a word, and for the 409 this operation sends the word is `CONFLICT`. That is
 * the whole of the classification: the envelope's `errorCode` is the generic
 * handled-server-error member for both conditions, and the sentence naming which
 * one it was sits in `details` as free text, which nothing here reads.
 *
 * Anything that is not that envelope is not a conflict: a gateway's HTML, or the
 * proxy's own refusal in the same envelope under a `PROXY_*` code, says nothing
 * about the spend, and treating one as a conflict would put an unrelated failure
 * on the road to a charge.
 */
export const isSpendConflict = (refusal: unknown): boolean => {
  if (typeof refusal !== 'object' || refusal === null) {
    return false;
  }

  const { error } = refusal as { error?: unknown };

  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const { code } = error as { code?: unknown };

  return code === 'CONFLICT';
};
