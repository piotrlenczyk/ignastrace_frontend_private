import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { getFunnelPlan } from '@/actions/funnel-plan';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getApi } from '@/libs/server/api';
import { getUserCountry } from '@/libs/server/user-country';
import { getCheckoutPricing } from '@/server/getters/pricing.getters';
import { getServerSession } from '@/server/session/session.utils';

import { CheckoutPageClient } from './_page';

const CheckoutPage = async () => {
  const session = await getServerSession();
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

  const formattedNumber = formatPhoneNumber(phoneNumber);

  const { pricing, initialCurrency } = await getCheckoutPricing(country);

  await redirectIfAuthenticated({
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
          initialCurrency={initialCurrency}
          formattedNumber={formattedNumber}
          country={country}
          pricing={pricing}
          enableUpsells={enableUpsells}
          plan={plan}
        />
      </main>
    </FunnelLayout>
  );
};

export default CheckoutPage;
