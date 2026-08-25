'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useUpsellConfirmation } from '@/components/upsell/upsell-purchase-surface';
import {
  buyUpsell,
  type CreditBalance,
  type CreditProduct,
  isSpendConflict,
  type PurchaseOutcome,
  type PurchaseResult,
  type SettledSpend,
  type SpendOutcome,
  type SpendRequest,
  spendUpsellCredit,
  type UnlockOutcome,
  unlockUpsellWithCredit,
} from '@/libs/upsell-unlock';
import { useConsumeUpsellMutation } from '@/network/api/hooks/use-consume-upsell-mutation';
import {
  UPSELL_CREDITS_QUERY_KEY,
  UPSELL_CREDITS_QUERY_OPTIONS,
  upsellCreditCount,
} from '@/network/api/hooks/use-upsell-credits-query';
import { useBuyUpsellProductMutation } from '@/network/payments-api/hooks/use-buy-upsell-product-mutation';

/**
 * The two upselling writes and the balance read that disambiguates them, in the
 * order `upsell-unlock` decides, wired to the generated hooks.
 *
 * This is the adapter and nothing else: it turns two rejections into the
 * vocabulary the pure module reads, reads the balance the module asks for, hands
 * it the confirmation the surface around the call site can make, and invalidates
 * the credit balances afterwards. The rule about money is not here — it is in
 * `src/libs/upsell-unlock.ts`, which is where it is tested.
 *
 * Both writes are ordinary query-library mutations: neither sets a cookie, causes
 * a navigation nor changes server-rendered output on its own. A spend does change
 * what a report's server components render, so a call site follows a successful
 * unlock with `router.refresh()`; that is the call site's decision and not this
 * hook's.
 */
export const useUpsellUnlock = () => {
  const confirm = useUpsellConfirmation();
  const { mutateAsync: buyProduct } = useBuyUpsellProductMutation();
  const { mutateAsync: consumeCredit } = useConsumeUpsellMutation();
  const queryClient = useQueryClient();

  /*
   * A client secret means the charge is not final, whatever `success` says
   * alongside it, so it is read first: reporting a charge awaiting a challenge as
   * a completed sale is the one mistake here that costs a member money and gives
   * them nothing. A refusal — a decline, a dead service, a body that never
   * arrived — is `refused`, because there is nothing in any of those cases for a
   * caller to do differently.
   */
  const buy = useCallback(
    async (priceId: string): Promise<PurchaseOutcome> => {
      try {
        const answer = await buyProduct({ body: { priceId } });

        if (answer.clientSecret) {
          return { status: 'confirmation-required', clientSecret: answer.clientSecret };
        }

        return answer.success ? { status: 'purchased' } : { status: 'refused' };
      } catch {
        return { status: 'refused' };
      }
    },
    [buyProduct],
  );

  const spend = useCallback(
    async (request: SpendRequest): Promise<SpendOutcome> => {
      try {
        await consumeCredit({ body: request });

        return 'spent';
      } catch (refusal) {
        return isSpendConflict(refusal) ? 'conflict' : 'refused';
      }
    },
    [consumeCredit],
  );

  /*
   * A fresh read, deliberately: `fetchQuery` with staleness disabled goes to the
   * new API rather than answering out of whatever the credits query happens to
   * hold. The number this returns is what decides whether money moves, and the
   * cached one is exactly the stale number the inference exists to correct.
   *
   * A read that throws answers `'unknown'`, which the module turns into a
   * refusal — an unreachable balance never produces a charge.
   */
  const readBalance = useCallback(
    async (product: CreditProduct): Promise<CreditBalance> => {
      try {
        const balances = await queryClient.fetchQuery({ ...UPSELL_CREDITS_QUERY_OPTIONS, staleTime: 0 });

        return upsellCreditCount(balances, product);
      } catch {
        return 'unknown';
      }
    },
    [queryClient],
  );

  /** Every path through this hook moves the balance, so every path re-reads it. */
  const settleBalances = useCallback(
    () => queryClient.invalidateQueries({ queryKey: UPSELL_CREDITS_QUERY_KEY }),
    [queryClient],
  );

  /**
   * Unlocks a section the new API holds a credit balance for: spend, and buy first
   * only where a fresh balance says there is nothing to spend.
   */
  const unlockWithCredit = useCallback(
    async (request: SpendRequest, priceId: string): Promise<UnlockOutcome> => {
      const outcome = await unlockUpsellWithCredit(request, priceId, { spend, readBalance, buy, confirm });

      await settleBalances();

      return outcome;
    },
    [buy, confirm, readBalance, settleBalances, spend],
  );

  /**
   * Spends a credit and buys nothing, whatever the answer.
   *
   * This is the section's own unlock button, taken where a balance says a credit
   * is held: no price is shown, so no charge may follow. It answers in the call
   * site's own terms — the section is open, the balance is empty so the priced
   * dialog is what comes next, or the attempt failed — and a conflicting spend is
   * settled by the same balance read the full sequence uses, so no entry point
   * offers to sell a member a section they already hold.
   */
  const spendCredit = useCallback(
    async (request: SpendRequest): Promise<SettledSpend> => {
      const outcome = await spendUpsellCredit(request, { spend, readBalance });

      await settleBalances();

      return outcome;
    },
    [readBalance, settleBalances, spend],
  );

  /**
   * Buys an upsell with nothing to spend it against: a funnel step, where no
   * report exists yet and the credit waits on the balance, and unlimited PDF
   * downloads, which the new API grants as an entitlement rather than a balance.
   */
  const purchase = useCallback(
    async (priceId: string): Promise<PurchaseResult> => {
      const result = await buyUpsell(priceId, { buy, confirm });

      await settleBalances();

      return result;
    },
    [buy, confirm, settleBalances],
  );

  return { spendCredit, unlockWithCredit, purchase };
};
