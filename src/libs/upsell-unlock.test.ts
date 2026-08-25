import { describe, expect, it, vi } from 'vitest';

import {
  buyUpsell,
  type ConfirmationOutcome,
  isEmptyCreditBalance,
  type PurchaseOutcome,
  type SpendOutcome,
  unlockUpsellWithCredit,
} from './upsell-unlock';

const PRICE_ID = 'price-uuid';

const REQUEST = { product: 'DATA_LEAKS', reportId: 'report-uuid' } as const;

/**
 * The three operations, each answering what a case is about. A spend can be told
 * to answer differently the second time, which is the only place in the sequence
 * where one operation is reached twice.
 */
const operations = ({
  spend = ['spent'],
  buy = { status: 'refused' },
  confirm = 'confirmed',
}: {
  spend?: SpendOutcome[];
  buy?: PurchaseOutcome;
  confirm?: ConfirmationOutcome;
} = {}) => {
  const answers = [...spend];

  return {
    spend: vi.fn(async () => answers.shift() ?? answers.at(-1) ?? 'refused'),
    buy: vi.fn(async () => buy),
    confirm: vi.fn(async () => confirm),
  };
};

describe('unlocking a section the new API holds a credit balance for', () => {
  it('spends a credit where one is left, and buys nothing', async () => {
    const ops = operations({ spend: ['spent'] });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'unlocked' });

    expect(ops.spend).toHaveBeenCalledTimes(1);
    expect(ops.buy).not.toHaveBeenCalled();
    expect(ops.confirm).not.toHaveBeenCalled();
  });

  it('spends the credit against the report and the owner it was asked to unlock', async () => {
    const ops = operations({ spend: ['spent'] });
    const request = { product: 'SEX_OFFENDERS', reportId: 'report-uuid', ownerId: 'owner-uuid' } as const;

    await unlockUpsellWithCredit(request, PRICE_ID, ops);

    expect(ops.spend).toHaveBeenCalledWith(request);
  });

  it('buys before spending where no credit is left, and unlocks on the second spend', async () => {
    const ops = operations({ spend: ['no-credit', 'spent'], buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'unlocked' });

    expect(ops.buy).toHaveBeenCalledWith(PRICE_ID);
    expect(ops.spend).toHaveBeenCalledTimes(2);
    expect(ops.confirm).not.toHaveBeenCalled();
  });

  it('confirms the charge the provider asks the cardholder for, then spends', async () => {
    const ops = operations({
      spend: ['no-credit', 'spent'],
      buy: { status: 'confirmation-required', clientSecret: 'secret' },
      confirm: 'confirmed',
    });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'unlocked' });

    expect(ops.confirm).toHaveBeenCalledWith('secret');
    expect(ops.spend).toHaveBeenCalledTimes(2);
  });

  it('reports a confirmation that was failed or dismissed, and spends nothing more', async () => {
    const ops = operations({
      spend: ['no-credit', 'spent'],
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
      spend: ['no-credit', 'spent'],
      buy: { status: 'confirmation-required', clientSecret: 'secret' },
      confirm: 'unavailable',
    });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({
      outcome: 'confirmation-failed',
    });

    expect(ops.spend).toHaveBeenCalledTimes(1);
  });

  it('reports a purchase that was refused, and spends nothing more', async () => {
    const ops = operations({ spend: ['no-credit', 'spent'], buy: { status: 'refused' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'purchase-failed' });

    expect(ops.spend).toHaveBeenCalledTimes(1);
    expect(ops.confirm).not.toHaveBeenCalled();
  });

  /*
   * The one rule that keeps money and entitlement in step: a spend refused for
   * any reason other than an empty balance never leads to a charge.
   */
  it('buys nothing where the spend was refused for a reason other than an empty balance', async () => {
    const ops = operations({ spend: ['refused'], buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'spend-refused' });

    expect(ops.buy).not.toHaveBeenCalled();
  });

  /*
   * The charge succeeded and the section stayed locked, which is the symptom ADR
   * 0030 names: the backend's listener did not grant the credit.
   */
  it('reports a bought credit the new API then would not spend', async () => {
    const ops = operations({ spend: ['no-credit', 'no-credit'], buy: { status: 'purchased' } });

    await expect(unlockUpsellWithCredit(REQUEST, PRICE_ID, ops)).resolves.toEqual({ outcome: 'spend-refused' });

    expect(ops.buy).toHaveBeenCalledTimes(1);
    expect(ops.spend).toHaveBeenCalledTimes(2);
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

  it('spends nothing: a funnel step has no report to spend against', async () => {
    const ops = operations({ buy: { status: 'purchased' } });

    await buyUpsell(PRICE_ID, ops);

    expect(ops.spend).not.toHaveBeenCalled();
  });
});

describe('reading an empty balance out of a refusal', () => {
  it('recognises the code that names the condition', () => {
    expect(
      isEmptyCreditBalance({
        error: { message: 'An upsell is required', errorCode: 'UPSELL_REQUIRED_ERROR', code: 'FORBIDDEN' },
      }),
    ).toBe(true);
  });

  /*
   * The dangerous near-miss, and the reason it is a case of its own. The entity a
   * consume request names is the report, so this code far more plausibly means
   * "not your report" than "no credit" — and reading it as an empty balance would
   * charge a member whose spend failed for an unrelated reason.
   */
  it('reads an entity that was not found as something other than an empty balance', () => {
    expect(isEmptyCreditBalance({ error: { errorCode: 'ENTITY_NOT_FOUND_ERROR', code: 'NOT_FOUND' } })).toBe(false);
  });

  it.each([
    ['a permission refusal', { error: { errorCode: 'INSUFFICIENT_PERMISSIONS' } }],
    ['a validation refusal', { error: { errorCode: 'VALIDATION_ERROR' } }],
    ['a server failure', { error: { errorCode: 'INTERNAL_SERVER_ERROR' } }],
    ["the proxy's own refusal, in the same envelope", { error: { errorCode: 'PROXY_PATH_UNKNOWN' } }],
  ])('reads %s as something other than an empty balance', (_case, refusal) => {
    expect(isEmptyCreditBalance(refusal)).toBe(false);
  });

  /*
   * A gateway's HTML, a proxy's own JSON, a thrown string: none of them says
   * anything about a balance, and reading one as an empty balance would raise a
   * charge on a member whose spend failed for an unrelated reason.
   */
  it.each([
    ['nothing at all', undefined],
    ['null', null],
    ['a string', 'Bad Gateway'],
    ['an envelope with no error', {}],
    ['an envelope whose error is a string', { error: 'UPSELL_REQUIRED_ERROR' }],
    ['an envelope with no code', { error: {} }],
    ['a code that is not a string', { error: { errorCode: 404 } }],
  ])('reads %s as something other than an empty balance', (_case, refusal) => {
    expect(isEmptyCreditBalance(refusal)).toBe(false);
  });
});
