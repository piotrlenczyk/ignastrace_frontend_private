import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { hasAdyenRedirectResult } from '@/components/checkout/adyen/adyenRedirect.helpers';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { CHECKOUT_COOKIE_KEY, DEFAULT_FUNNEL_PLAN, parseCheckoutData } from '@/libs/checkout-cookie';
import { getApi } from '@/libs/server/api';
import { getCheckoutPricing } from '@/server/getters/pricing.getters';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

import { CheckoutPageClient } from './_page';

const CheckoutPage = async (props: PageProps<'/[locale]/checkout'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.SIGN_UP);
  }

  const [api, settings, phoneNumber, requestCookies] = await Promise.all([
    getApi(),
    getServerSettings(),
    getFunnelPhone(),
    cookies(),
  ]);
  const country = settings.countryCode;

  const formattedNumber = formatPhoneNumber(phoneNumber);

  /*
   * What the visitor answered on the way here: the plan from the homepage, and
   * the currency from a previous visit to this screen. A cookie that is absent —
   * a direct link — or one that no longer parses opens on the funnel's default
   * plan in the market's currency, which is what this screen did before it
   * recorded anything.
   */
  const attempt = parseCheckoutData(requestCookies.get(CHECKOUT_COOKIE_KEY)?.value);
  const plan = attempt?.plan ?? DEFAULT_FUNNEL_PLAN;

  const { pricing, initialCurrency } = await getCheckoutPricing(country, attempt?.currency);

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
      activeSubscriptionRoute: ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
      endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
      noSubscriptionRoute: !formattedNumber.valid ? ROUTES.HOME : undefined,
    });
  }

  const enableUpsells = settings.upsellsEnabled;

  if (!isResumingRedirect) {
    api.post('/klaviyo/checkout_started');
  }

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
