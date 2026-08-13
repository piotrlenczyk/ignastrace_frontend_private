import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getCurrencyFromCountry } from '@/libs/currency';
import { getApi } from '@/libs/server/api';
import { getUserCountry } from '@/libs/server/user-country';
import { getSession } from '@/server/session/session.server';
import type { Products } from '@/types/products';

import { LookupCheckoutPageClient } from './_page';

const Index = async () => {
  const session = await getSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.REVERSE_LOOKUP.SIGN_UP);
  }

  const [api, country, phoneNumber] = await Promise.all([getApi(), getUserCountry(), getFunnelPhone()]);

  const currency = getCurrencyFromCountry(country);
  const formattedNumber = formatPhoneNumber(phoneNumber);

  let defaultProduct: Products;
  try {
    defaultProduct = await api.get<Products>(`/products?currency=${currency}`);
  } catch (error) {
    console.error('Error fetching products:', error);

    redirect(ROUTES.REVERSE_LOOKUP.HOME);
  }

  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.REVERSE_LOOKUP.HOME,
    endedSubscriptionRoute: ROUTES.REVERSE_LOOKUP.HOME,
    noSubscriptionRoute: !formattedNumber.valid ? ROUTES.REVERSE_LOOKUP.HOME : undefined,
  });

  api.post('/klaviyo/checkout_started', {
    flow: 'reverse_lookup',
    product: 'reverse_lookup',
  });

  return (
    <FunnelLayout positionMobileHeader="static" isReverseLookup showLogoLink={false}>
      <main className="s-main flex flex-col">
        <LookupCheckoutPageClient
          currency={currency}
          formattedNumber={formattedNumber}
          country={country}
          defaultProduct={defaultProduct}
          phoneNumber={phoneNumber}
        />
      </main>
    </FunnelLayout>
  );
};

export default Index;
