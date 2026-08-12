import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { getFunnelPlan } from '@/actions/funnel-plan';
import { auth } from '@/auth';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { useAuthenticatedRedirect } from '@/hooks/use-auth-redirect';
import { usePhoneNumberFormatter } from '@/hooks/use-phone-number-formatter';
import { getCurrencyFromCountry } from '@/libs/currency';
import { getApi } from '@/libs/server/api';
import { getUserCountry } from '@/libs/server/user-country';
import type { Products } from '@/types/products';

import { CheckoutPageClient } from './_page';

const CheckoutPage = async () => {
  const session = await auth();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.SIGN_UP);
  }

  const [api, country, phoneNumber, plan] = await Promise.all([
    getApi(),
    getUserCountry(),
    getFunnelPhone(),
    getFunnelPlan(),
  ]);

  const currency = getCurrencyFromCountry(country);
  const formattedNumber = usePhoneNumberFormatter(phoneNumber);

  let defaultProduct: Products;
  try {
    defaultProduct = await api.get<Products>(`/products?currency=${currency}`);
  } catch (error) {
    console.error('Error fetching products:', error);

    redirect(ROUTES.HOME);
  }

  await useAuthenticatedRedirect({
    activeSubscriptionRoute: ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    noSubscriptionRoute: !formattedNumber.valid ? ROUTES.HOME : undefined,
  });

  const enableUpsells = process.env.ENABLE_UPSELLS === 'true';

  api.post('/klaviyo/checkout_started');

  return (
    <FunnelLayout positionMobileHeader="static" showLogoLink={false}>
      <main className="s-main flex flex-col">
        <CheckoutPageClient
          currency={currency}
          formattedNumber={formattedNumber}
          country={country}
          defaultProduct={defaultProduct}
          enableUpsells={enableUpsells}
          plan={plan}
        />
      </main>
    </FunnelLayout>
  );
};

export default CheckoutPage;
