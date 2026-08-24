import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getMemberCurrency, getReactivationProduct } from '@/libs/pricing';
import { getUserPricing } from '@/server/getters/pricing.getters';
import { getSubscription } from '@/server/getters/subscription.getters';
import { getServerSettings } from '@/settings/settings.server';

import { BillingPageClient } from './_components/billing-page-client';

/**
 * The reactivation price, read from the catalogue the payments service offers a
 * member who has subscribed before rather than the guest one.
 *
 * It is resolved here, and only for the state that offers reactivation, for two
 * reasons: a read the server can do should not become a second network path in
 * the browser, and a screen a member reaches to read their billing history
 * should not fail because a price they are not being offered is unreadable.
 *
 * That is also why this is the one price resolution in the application that
 * catches. Reactivation resolves the non-trial product strictly, so a catalogue
 * publishing only the trial one throws rather than quietly selling a trial to
 * someone who has already had it — and a member reading their history, their
 * dates and their cancellation options must not lose all of it to a price they
 * are not being offered. The incident is logged so a misconfigured catalogue is
 * discoverable rather than silently costing sales.
 */
const getActivationProduct = async ({ country, previousCurrency }: { country: string; previousCurrency: string }) => {
  try {
    const pricing = await getUserPricing(country);

    return getReactivationProduct({
      pricing,
      currency: getMemberCurrency({ supportedCurrencies: pricing.supportedCurrencies, previousCurrency }),
    });
  } catch (error) {
    console.error('Cannot resolve a reactivation price; the billing screen renders without the offer', error);

    return undefined;
  }
};

/**
 * The subscription is read from the payments service, which is the only upstream
 * that models one — the new API publishes no subscription path at all.
 *
 * A member the payments service holds nothing for is sent home, exactly as a
 * member with no legacy subscription was before. That branch is now the common
 * one rather than the exceptional one, and ADR 0024 records what it costs.
 */
const BillingPage = async () => {
  const { data: subscription } = await getSubscription();

  if (!subscription) {
    redirect(ROUTES.HOME);
  }

  const country = (await getServerSettings()).countryCode;

  const activationProduct =
    subscription.calculatedStatus === 'expired'
      ? await getActivationProduct({ country, previousCurrency: subscription.product.price.currency })
      : undefined;

  return <BillingPageClient subscription={subscription} country={country} activationProduct={activationProduct} />;
};

export default BillingPage;
