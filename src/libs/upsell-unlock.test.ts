import { describe, expect, it, vi } from 'vitest';

import {
  buyUpsell,
  type ConfirmationOutcome,
  type CreditBalance,
  isSpendConflict,
  type PurchaseOutcome,
  type SpendOutcome,
  spendUpsellCredit,
  unlockUpsellWithCredit,
} from './upsell-unlock';

const PRICE_ID = 'price-uuid';

const REQUEST = { product: 'DATA_LEAKS', reportId: 'report-uuid' } as const;

/**
 * The four operations, each answering what a case is about. A spend can be told
 * to answer differently the second time, which is the only place in the sequence
 * where one operation is reached twice.
 */
const operations = ({
  spend = ['spent'],
  balance = 0,
  buy = { status: 'refused' },
  confirm = 'confirmed',
}: {
  spend?: SpendOutcome[];
  balance?: CreditBalance;
  buy?: PurchaseOutcome;
  confirm?: ConfirmationOutcome;
} = {}) => {
  const answers = [...spend];

  return {
    spend: vi.fn(async () => answers.shift() ?? answers.at(-1) ?? 'refused'),
    readBalance: vi.fn(async () => balance),
    buy: vi.fn(async () => buy),
    confirm: vi.fn(async () => confirm),
  };
};

describe('unlocking a section the new API holds a credit balance for', () => {
  it('spends a credit where one is left, and buys nothing', async () => {
    const ops = operations({ spend: ['spent'] });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'unlocked' });

    expect(ops.spend).toHaveBeenCalledTimes(1);
    expect(ops.readBalance).not.toHaveBeenCalled();
    expect(ops.buy).not.toHaveBeenCalled();
    expect(ops.confirm).not.toHaveBeenCalled();
  });

  it('spends the credit against the report and the owner it was asked to unlock', async () => {
    const ops = operations({ spend: ['spent'] });
    const request = { product: 'SEX_OFFENDERS', reportId: 'report-uuid', ownerId: 'owner-uuid' } as const;

    await unlockUpsellWithCredit(request, PRICE_ID, ops);

    expect(ops.spend).toHaveBeenCalledWith(request);
  });

  it('buys before spending where the conflicting spend left a zero balance, and unlocks on the second spend', async () => {
    const ops = operations({ spend: ['conflict', 'spent'], balance: 0, buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'unlocked' });

    expect(ops.readBalance).toHaveBeenCalledWith('DATA_LEAKS');
    expect(ops.buy).toHaveBeenCalledWith(PRICE_ID);
    expect(ops.spend).toHaveBeenCalledTimes(2);
    expect(ops.confirm).not.toHaveBeenCalled();
  });

  /*
   * The conflict that means the opposite thing. Status, error code and message
   * are byte-for-byte those of an empty balance, and only the balance says which
   * it was — so a positive one is content the member already owns, and charging
   * for it is the mistake this whole inference exists to prevent.
   */
  it('unlocks without buying where the conflicting spend left a credit in the balance', async () => {
    const ops = operations({ spend: ['conflict'], balance: 1, buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'unlocked' });

    expect(ops.buy).not.toHaveBeenCalled();
    expect(ops.spend).toHaveBeenCalledTimes(1);
  });

  it('refuses without buying where the balance behind the conflict cannot be read', async () => {
    const ops = operations({ spend: ['conflict'], balance: 'unknown', buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'spend-refused' });

    expect(ops.buy).not.toHaveBeenCalled();
    expect(ops.spend).toHaveBeenCalledTimes(1);
  });

  it('confirms the charge the provider asks the cardholder for, then spends', async () => {
    const ops = operations({
      spend: ['conflict', 'spent'],
      balance: 0,
      buy: { status: 'confirmation-required', clientSecret: 'secret' },
      confirm: 'confirmed',
    });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'unlocked' });

    expect(ops.confirm).toHaveBeenCalledWith('secret');
    expect(ops.spend).toHaveBeenCalledTimes(2);
  });

  it('reports a confirmation that was failed or dismissed, and spends nothing more', async () => {
    const ops = operations({
      spend: ['conflict', 'spent'],
      balance: 0,
      buy: { status: 'confirmation-required', clientSecret: 'secret' },
      confirm: 'refused',
    });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({
      outcome: 'confirmation-failed',
    });

    expect(ops.spend).toHaveBeenCalledTimes(1);
  });

  /*
   * A market the payments service routes to Adyen or NMI: the offer is made and
   * a non-authenticated charge goes through, but a client secret arriving where
   * no Stripe instance exists cannot be confirmed. A clear failure, not a
   * spinner that never resolves.
   */
  it('reports a confirmation it has no instance to make', async () => {
    const ops = operations({
      spend: ['conflict', 'spent'],
      balance: 0,
      buy: { status: 'confirmation-required', clientSecret: 'secret' },
      confirm: 'unavailable',
    });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({
      outcome: 'confirmation-failed',
    });

    expect(ops.spend).toHaveBeenCalledTimes(1);
  });

  it('reports a purchase that was refused, and spends nothing more', async () => {
    const ops = operations({ spend: ['conflict', 'spent'], balance: 0, buy: { status: 'refused' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'purchase-failed' });

    expect(ops.spend).toHaveBeenCalledTimes(1);
    expect(ops.confirm).not.toHaveBeenCalled();
  });

  /*
   * The one rule that keeps money and entitlement in step: a spend refused for a
   * reason that says nothing about the balance never leads to a charge, and never
   * even asks what the balance is.
   */
  it('buys nothing and reads no balance where the spend was refused outside a conflict', async () => {
    const ops = operations({ spend: ['refused'], balance: 0, buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'spend-refused' });

    expect(ops.readBalance).not.toHaveBeenCalled();
    expect(ops.buy).not.toHaveBeenCalled();
  });

  /*
   * The charge succeeded and the section stayed locked, which is the symptom ADR
   * 0030 names: the backend's listener did not grant the credit. The second spend
   * is final — the balance is not consulted again, so a credit minted a moment
   * later cannot turn into a second purchase inside one attempt.
   */
  it('reports a bought credit the new API then would not spend, without re-reading the balance', async () => {
    const ops = operations({ spend: ['conflict', 'conflict'], balance: 0, buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'spend-refused' });

    expect(ops.buy).toHaveBeenCalledTimes(1);
    expect(ops.spend).toHaveBeenCalledTimes(2);
    expect(ops.readBalance).toHaveBeenCalledTimes(1);
  });
});

describe("spending a credit for a section's own unlock button", () => {
  it('answers unlocked where the credit was spent', async () => {
    const ops = operations({ spend: ['spent'] });

    await expect(spendUpsellCredit(REQUEST, ops)).resolves.toBe('unlocked');

    expect(ops.readBalance).not.toHaveBeenCalled();
  });

  /*
   * The stale balance the button was rendered from: the section is not locked at
   * all, so the member is taken to the content rather than shown an offer to buy
   * what they already hold.
   */
  it('answers unlocked where a conflict turns out to have a credit behind it', async () => {
    const ops = operations({ spend: ['conflict'], balance: 2 });

    await expect(spendUpsellCredit(REQUEST, ops)).resolves.toBe('unlocked');
  });

  it('answers no-credit where a conflict turns out to have an empty balance behind it', async () => {
    const ops = operations({ spend: ['conflict'], balance: 0 });

    await expect(spendUpsellCredit(REQUEST, ops)).resolves.toBe('no-credit');
  });

  it('answers refused where the balance behind a conflict cannot be read', async () => {
    const ops = operations({ spend: ['conflict'], balance: 'unknown' });

    await expect(spendUpsellCredit(REQUEST, ops)).resolves.toBe('refused');
  });

  it('answers refused, and reads no balance, for a refusal outside a conflict', async () => {
    const ops = operations({ spend: ['refused'] });

    await expect(spendUpsellCredit(REQUEST, ops)).resolves.toBe('refused');

    expect(ops.readBalance).not.toHaveBeenCalled();
  });

  it('never buys anything: no price has been quoted at this point', async () => {
    const ops = operations({ spend: ['conflict'], balance: 0 });

    await spendUpsellCredit(REQUEST, ops);

    expect(ops.buy).not.toHaveBeenCalled();
    expect(ops.confirm).not.toHaveBeenCalled();
  });
});

describe('buying an upsell with no credit behind it', () => {
  it('buys the price row that was quoted', async () => {
    const ops = operations({ buy: { status: 'purchased' } });

    await expect(buyUpsell(PRICE_ID, ops)).resolves.toEqual({ outcome: 'purchased' });

    expect(ops.buy).toHaveBeenCalledWith(PRICE_ID);
    expect(ops.confirm).not.toHaveBeenCalled();
  });

  it('confirms a charge the provider asks the cardholder for', async () => {
    const ops = operations({ buy: { status: 'confirmation-required', clientSecret: 'secret' } });

    await expect(buyUpsell(PRICE_ID, ops)).resolves.toEqual({ outcome: 'purchased' });

    expect(ops.confirm).toHaveBeenCalledWith('secret');
  });

  it.each(['refused', 'unavailable'] as const)('reports a confirmation that answered %s', async (confirm) => {
    const ops = operations({ buy: { status: 'confirmation-required', clientSecret: 'secret' }, confirm });

    await expect(buyUpsell(PRICE_ID, ops)).resolves.toEqual({ outcome: 'confirmation-failed' });
  });

  it('reports a purchase that was refused', async () => {
    const ops = operations({ buy: { status: 'refused' } });

    await expect(buyUpsell(PRICE_ID, ops)).resolves.toEqual({ outcome: 'purchase-failed' });

    expect(ops.confirm).not.toHaveBeenCalled();
  });

  it('spends nothing and reads no balance: a funnel step has no report to spend against', async () => {
    const ops = operations({ buy: { status: 'purchased' } });

    await buyUpsell(PRICE_ID, ops);

    expect(ops.spend).not.toHaveBeenCalled();
    expect(ops.readBalance).not.toHaveBeenCalled();
  });
});

describe('reading a conflict out of a refusal', () => {
  /*
   * The 409 the consume operation actually sends, as observed. Its `errorCode` is
   * the generic handled-server-error member and its `message` is the same for both
   * conditions the conflict covers, so the status word is the only thing read.
   */
  it('recognises the conflict envelope, whichever condition it stood for', () => {
    expect(
      isSpendConflict({
        error: {
          message: 'Conflict',
          errorCode: 'HANDLED_INTERNAL_SERVER_ERROR',
          code: 'CONFLICT',
          details: 'Not enough credits',
        },
      }),
    ).toBe(true);

    expect(
      isSpendConflict({
        error: {
          message: 'Conflict',
          errorCode: 'HANDLED_INTERNAL_SERVER_ERROR',
          code: 'CONFLICT',
          details: 'Content is already unlocked',
        },
      }),
    ).toBe(true);
  });

  /*
   * The dangerous near-miss, and the reason it is a case of its own. The entity a
   * consume request names is the report, so this refusal far more plausibly means
   * "not your report" than anything about a balance — and putting it on the road
   * to a charge would take money from a member whose spend failed for an
   * unrelated reason.
   */
  it('reads an entity that was not found as something other than a conflict', () => {
    expect(isSpendConflict({ error: { errorCode: 'ENTITY_NOT_FOUND_ERROR', code: 'NOT_FOUND' } })).toBe(false);
  });

  it.each([
    ['a dead session', { error: { errorCode: 'INVALID_TOKEN', code: 'UNAUTHORIZED' } }],
    ['a permission refusal', { error: { errorCode: 'INSUFFICIENT_PERMISSIONS', code: 'FORBIDDEN' } }],
    ['a validation refusal', { error: { errorCode: 'VALIDATION_ERROR', code: 'BAD_REQUEST' } }],
    ['a server failure', { error: { errorCode: 'INTERNAL_SERVER_ERROR', code: 'INTERNAL_SERVER_ERROR' } }],
    [
      "the proxy's own refusal, in the same envelope",
      { error: { errorCode: 'PROXY_PATH_UNKNOWN', code: 'NOT_FOUND' } },
    ],
  ])('reads %s as something other than a conflict', (_case, refusal) => {
    expect(isSpendConflict(refusal)).toBe(false);
  });

  /*
   * A gateway's HTML, a proxy's own JSON, a thrown string: none of them says
   * anything about the spend, and reading one as a conflict would put an
   * unrelated failure on the road to a charge.
   */
  it.each([
    ['nothing at all', undefined],
    ['null', null],
    ['a string', 'Bad Gateway'],
    ['an envelope with no error', {}],
    ['an envelope whose error is a string', { error: 'CONFLICT' }],
    ['an envelope with no status word', { error: {} }],
    ['a status word that is not a string', { error: { code: 409 } }],
  ])('reads %s as something other than a conflict', (_case, refusal) => {
    expect(isSpendConflict(refusal)).toBe(false);
  });
});
