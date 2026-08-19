import WebsiteLayout from '@/components/layouts/website-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { getCurrencyByCountryCode } from '@/libs/currency';
import { getCurrencyProducts } from '@/libs/pricing';
import { getPricePagePricing } from '@/server/getters/pricing.getters';
import { getServerSettings } from '@/settings/settings.server';

import { PricingContent } from './_components/content';

export default async function PricingPage() {
  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  const countryCode = (await getServerSettings()).countryCode;
  const currency = getCurrencyByCountryCode(countryCode);
  const pricing = await getPricePagePricing();
  const currencyProducts = getCurrencyProducts({
    products: pricing.products,
    currency,
  });

  if (!currencyProducts[0]) {
    throw new Error('No currency products found');
  }
  const price = currencyProducts[0].price;
  return (
    <WebsiteLayout>
      <div className="s-main pb-10 lg:px-6">
        <PricingContent country={countryCode} price={price} />
      </div>
    </WebsiteLayout>
  );
}
