import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { hasAdyenRedirectResult } from '@/components/checkout/adyen/adyenRedirect.helpers';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getApi } from '@/libs/server/api';
import { getCheckoutPricing } from '@/server/getters/pricing.getters';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

import { LookupCheckoutPageClient } from './_page';

const Index = async (props: PageProps<'/[locale]/lookup-checkout'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.REVERSE_LOOKUP.SIGN_UP);
  }

  const [api, settings, phoneNumber] = await Promise.all([getApi(), getServerSettings(), getFunnelPhone()]);
  const country = settings.countryCode;

  const formattedNumber = formatPhoneNumber(phoneNumber);

  const { pricing, initialCurrency } = await getCheckoutPricing(country);

  /*
   * A shopper coming back from a redirect-based 3-D Secure challenge did not start
   * a checkout — they are finishing the one they started before they left. The
   * guards below stand aside for them, because completing the payment needs this
   * screen to render the island again, and the funnel report is skipped for the
   * same reason: counting a second start would double the top of the funnel every
   * time a card asks for a challenge.
   */
  const isResumingRedirect = hasAdyenRedirectResult(searchParams.redirectResult);

  if (!isResumingRedirect) {
    await redirectIfAuthenticated({
      activeSubscriptionRoute: ROUTES.REVERSE_LOOKUP.HOME,
      endedSubscriptionRoute: ROUTES.REVERSE_LOOKUP.HOME,
      noSubscriptionRoute: !formattedNumber.valid ? ROUTES.REVERSE_LOOKUP.HOME : undefined,
    });
  }

  if (!isResumingRedirect) {
    api.post('/klaviyo/checkout_started', {
      flow: 'reverse_lookup',
      product: 'reverse_lookup',
    });
  }

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
