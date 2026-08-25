'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useUpsellConfirmation } from '@/components/upsell/upsell-purchase-surface';
import {
  buyUpsell,
  isEmptyCreditBalance,
  type PurchaseOutcome,
  type PurchaseResult,
  type SpendOutcome,
  type SpendRequest,
  type UnlockOutcome,
  unlockUpsellWithCredit,
} from '@/libs/upsell-unlock';
import { useConsumeUpsellMutation } from '@/network/api/hooks/use-consume-upsell-mutation';
import { UPSELL_CREDITS_QUERY_KEY } from '@/network/api/hooks/use-upsell-credits-query';
import { useBuyUpsellProductMutation } from '@/network/payments-api/hooks/use-buy-upsell-product-mutation';

/**
 * The two upselling writes, in the order `upsell-unlock` decides, wired to the
 * generated hooks.
 *
 * This is the adapter and nothing else: it turns two rejections into the
 * vocabulary the pure module reads, hands it the confirmation the surface around
 * the call site can make, and invalidates the credit balances afterwards. The
 * rule about money is not here — it is in `src/libs/upsell-unlock.ts`, which is
 * where it is tested.
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
        return isEmptyCreditBalance(refusal) ? 'no-credit' : 'refused';
      }
    },
    [consumeCredit],
  );

  /** Every path through this hook moves the balance, so every path re-reads it. */
  const settleBalances = useCallback(
    () => queryClient.invalidateQueries({ queryKey: UPSELL_CREDITS_QUERY_KEY }),
    [queryClient],
  );

  /**
   * Unlocks a section the new API holds a credit balance for: spend, and buy first
   * only where there is nothing to spend.
   */
  const unlockWithCredit = useCallback(
    async (request: SpendRequest, priceId: string): Promise<UnlockOutcome> => {
      const outcome = await unlockUpsellWithCredit(request, priceId, { spend, buy, confirm });

      await settleBalances();

      return outcome;
    },
    [buy, confirm, settleBalances, spend],
  );

  /**
   * Spends a credit and does nothing else, whatever the answer.
   *
   * This is the section's own unlock button, taken where a balance says a credit
   * is held: no price is shown, so no charge may follow. A refusal sends the
   * member to the dialog, where a price is quoted before any money moves.
   */
  const spendCredit = useCallback(
    async (request: SpendRequest): Promise<SpendOutcome> => {
      const outcome = await spend(request);

      await settleBalances();

      return outcome;
    },
    [settleBalances, spend],
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
