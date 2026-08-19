import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getCheckoutProduct, getMemberCurrency } from '@/libs/pricing';
import { getApi } from '@/libs/server/api';
import { getUserPricing } from '@/server/getters/pricing.getters';
import { getServerSettings } from '@/settings/settings.server';
import type { Subscription } from '@/types/subscription';

import { BillingPageClient } from './_components/billing-page-client';

/**
 * The reactivation price, read from the catalogue the payments service offers a
 * member who has subscribed before rather than the guest one.
 *
 * It is resolved here, and only for the state that offers reactivation, for two
 * reasons: a read the server can do should not become a second network path in
 * the browser, and a screen a member reaches to read their billing history
 * should not fail because a price they are not being offered is unreadable.
 */
const getActivationProduct = async ({ country, previousCurrency }: { country: string; previousCurrency: string }) => {
  const pricing = await getUserPricing(country);

  return getCheckoutProduct({
    pricing,
    currency: getMemberCurrency({ supportedCurrencies: pricing.supportedCurrencies, previousCurrency }),
  });
};

const BillingPage = async () => {
  const api = await getApi();
  const subscription = await api.get<Subscription>('/subscription');

  const country = (await getServerSettings()).countryCode;

  if (!subscription) {
    redirect(ROUTES.HOME);
  }

  const activationProduct =
    subscription.status === 'expired'
      ? await getActivationProduct({ country, previousCurrency: subscription.currency })
      : undefined;

  return <BillingPageClient subscription={subscription} country={country} activationProduct={activationProduct} />;
};

export default BillingPage;
