import { resolveUpsellProduct, type UpsellProduct, type UpsellProductKey } from '@/libs/upsell-products';
import { paymentsApiServerClient } from '@/network/payments-api/payments-api-server-client';

/**
 * The upsell product a funnel step may offer, read from the payments service, or
 * nothing at all.
 *
 * Nothing is thrown and nothing is fallen back on. A refusal, an unreachable
 * service and a catalogue with no matching row all arrive at the caller as
 * `undefined`, because the step does the same thing in every one of those cases:
 * it skips itself. The alternative — an error page — would be shown to somebody
 * whose card was charged seconds earlier, and the alternative to *that* was the
 * hardcoded `195` this replaces, which quietly invented an amount.
 *
 * The cost is that a payments outage silently stops offering upsells rather than
 * announcing itself. That is accepted in ADR 0029, along with the symptom to
 * look for: upsells vanishing from every funnel step and every unlock dialog at
 * once, for everybody.
 *
 * Per ADR 0023 the call carries the shared technical account's credential, which
 * the payments server client attaches; no cookie is assembled here.
 */
export const getUpsellProduct = async (key: UpsellProductKey): Promise<UpsellProduct | undefined> => {
  try {
    const { data } = await paymentsApiServerClient['/products/upsell'].GET();

    return resolveUpsellProduct(data ?? [], key);
  } catch {
    return undefined;
  }
};
