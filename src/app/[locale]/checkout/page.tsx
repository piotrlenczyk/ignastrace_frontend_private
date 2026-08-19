import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { getFunnelPlan } from '@/actions/funnel-plan';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getApi } from '@/libs/server/api';
import { getCheckoutPricing } from '@/server/getters/pricing.getters';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

import { CheckoutPageClient } from './_page';

const CheckoutPage = async () => {
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.SIGN_UP);
  }

  const [api, settings, phoneNumber, plan] = await Promise.all([
    getApi(),
    getServerSettings(),
    getFunnelPhone(),
    getFunnelPlan(),
  ]);
  const country = settings.countryCode;

  const formattedNumber = formatPhoneNumber(phoneNumber);

  const { pricing, initialCurrency } = await getCheckoutPricing(country);

  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    noSubscriptionRoute: !formattedNumber.valid ? ROUTES.HOME : undefined,
  });

  const enableUpsells = settings.upsellsEnabled;

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
