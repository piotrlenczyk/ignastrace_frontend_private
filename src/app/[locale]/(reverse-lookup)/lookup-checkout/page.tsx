import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getApi } from '@/libs/server/api';
import { getCheckoutPricing } from '@/server/getters/pricing.getters';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

import { LookupCheckoutPageClient } from './_page';

const Index = async () => {
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.REVERSE_LOOKUP.SIGN_UP);
  }

  const [api, settings, phoneNumber] = await Promise.all([getApi(), getServerSettings(), getFunnelPhone()]);
  const country = settings.countryCode;

  const formattedNumber = formatPhoneNumber(phoneNumber);

  const { pricing, initialCurrency } = await getCheckoutPricing(country);

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
          initialCurrency={initialCurrency}
          formattedNumber={formattedNumber}
          country={country}
          pricing={pricing}
          phoneNumber={phoneNumber}
        />
      </main>
    </FunnelLayout>
  );
};

export default Index;
