import WebsiteLayout from '@/components/layouts/website-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { getCurrencyFromCountry } from '@/libs/currency';
import { getApi } from '@/libs/server/api';
import { getUserCountry } from '@/libs/server/user-country';
import type { Products } from '@/types/products';

import { PricingContent } from './_components/content';

export default async function PricingPage() {
  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  const api = await getApi();
  const country = await getUserCountry();
  const currency = getCurrencyFromCountry(country);
  const products = await api.get<Products>(`/products?currency=${currency}`);

  return (
    <WebsiteLayout>
      <div className="s-main pb-10 lg:px-6">
        <PricingContent country={country} currency={currency} products={products} />
      </div>
    </WebsiteLayout>
  );
}
