import {
  type PurchasedUpsellProduct,
  resolveUpsellProduct,
  type UpsellProduct,
  type UpsellProductKey,
} from '@/libs/upsell-products';
import { paymentsApiServerClient, type paymentsSchemas } from '@/network/payments-api/payments-api-server-client';

/**
 * The payments service's upsell catalogue, or nothing at all.
 *
 * Nothing is thrown and nothing is fallen back on. A refusal and an unreachable
 * service both arrive at the caller as `undefined`, because every screen that
 * reads this does the same thing in that case: it makes no offer. The
 * alternative — an error page — would be shown to somebody whose card was
 * charged seconds earlier, and the alternative to *that* was a hardcoded amount
 * that quietly invented a price.
 *
 * The client answers a refusal with an absent `data` rather than by throwing, so
 * the body is returned as it arrives and **not** defaulted to an empty list: an
 * empty catalogue and a catalogue nobody could read are different answers, and
 * only the `catch` here is about the transport failing outright.
 *
 * A screen offering more than one upsell reads this **once** and resolves each of
 * its keys from the one response, rather than asking per key.
 *
 * Per ADR 0023 the call carries the shared technical account's credential, which
 * the payments server client attaches; no cookie is assembled here.
 */
export const getUpsellProducts = async (): Promise<paymentsSchemas['GetUpsellProductResponseDto'][] | undefined> => {
  try {
    const { data } = await paymentsApiServerClient['/products/upsell'].GET();

    return data;
  } catch {
    return undefined;
  }
};

/**
 * The upsell product a funnel step may offer, read from the payments service, or
 * nothing at all.
 *
 * A refusal, an unreachable service and a catalogue with no matching row all
 * arrive at the caller as `undefined`, because the step does the same thing in
 * every one of those cases: it skips itself.
 *
 * The cost is that a payments outage silently stops offering upsells rather than
 * announcing itself. That is accepted in ADR 0029, along with the symptom to
 * look for: upsells vanishing from every funnel step and every unlock dialog at
 * once, for everybody.
 */
export const getUpsellProduct = async (key: UpsellProductKey): Promise<UpsellProduct | undefined> =>
  resolveUpsellProduct((await getUpsellProducts()) ?? [], key);

/**
 * The upsell products the payments service says the caller has bought, or
 * nothing at all where it could not be asked.
 *
 * `undefined` is a refusal or an unreachable service, and it is deliberately
 * **not** an empty list: `ownsAnyUpsell` turns it into "owns", so a count nobody
 * could read never leads to re-selling an extra to somebody who already paid for
 * it. The screen that reads this treats the absence as its own case — the
 * thank-you screen — rather than as ownership.
 *
 * Which is why the body is returned exactly as it arrives. The client answers a
 * refusal with an absent `data` and no exception, so defaulting that to an empty
 * list would report "owns nothing" for every 401, 403 and 500 — and while ADR 0023
 * stands, an environment with no payments credential configured sends this call
 * unauthenticated, making a refusal the *ordinary* answer there rather than the
 * rare one. That is the one direction this guard must not fail in.
 *
 * **Asking this endpoint at all reverses ADR 0030**, which said it never would be
 * because every payments call is raised as the shared technical account of
 * ADR 0023. ADR 0032 records why the order-success screen's two extras are the
 * one exception, and what it costs.
 */
export const getPurchasedUpsellProducts = async (): Promise<PurchasedUpsellProduct[] | undefined> => {
  try {
    const { data } = await paymentsApiServerClient['/products/upsell/user'].GET();

    return data;
  } catch {
    return undefined;
  }
};
