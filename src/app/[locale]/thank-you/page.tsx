import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { auth } from '@/auth';
import GTMPurchaseEvent from '@/components/gtm-purchase-event';
import FunnelLayout from '@/components/layouts/funnel-layout';
import TrustPilot from '@/components/success/trustPilot';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { Link } from '@/libs/i18n-routing';
import { getApi } from '@/libs/server/api';
import type { User } from '@/types/user';

const ThankYouPage = async () => {
  const session = await auth();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  await redirectIfAuthenticated({
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    noSubscriptionRoute: formattedNumber.valid ? ROUTES.CHECKOUT : ROUTES.HOME,
  });

  const t = await getTranslations('pages.success');
  const api = await getApi();
  const user = await api.get<User>('/user?expand=purchase_info');

  const gtmEventName = process.env.ENABLE_UPSELLS === 'true' ? 'upsell_purchase' : 'purchase';
  const gtmEventValue =
    process.env.ENABLE_UPSELLS === 'true'
      ? (user.purchase_info?.upsellings_price || 0) / 100
      : (user.purchase_info?.trial_price || 0) / 100;

  api.post('/klaviyo/order_confirmed');

  return (
    <>
      <GTMPurchaseEvent
        event={gtmEventName}
        userId={user.id}
        email={user.email}
        value={gtmEventValue}
        currency={user.currency.toUpperCase()}
      />
      <FunnelLayout>
        <main className="s-main flex full-main items-center p-6">
          <div className="container-small flex flex-col items-center gap-6 text-center">
            <div className="flex justify-center">
              <svg width="161" height="161" viewBox="0 0 161 161" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M107.224 39.7391C91.8824 37.6493 76.5483 36.1191 60.7693 36.5835C43.5021 37.0955 24.4322 38.5007 15.2042 51.8432C9.22085 60.5001 6.9119 69.9549 6.15248 79.6954C5.0402 94.0025 4.65667 110.018 10.8624 123.676C19.3618 142.378 40.1883 146.813 63.2853 149.195C83.4521 151.273 105.376 151.582 124.162 144.694C142.84 137.841 152.314 123.665 153.932 108.292C155.589 92.5438 157.484 75.5277 150.68 60.2858C143.837 44.9725 125.481 42.2337 107.217 39.745L107.224 39.7391Z"
                  fill="#F23D00"
                  fillOpacity="0.05"
                />
                <rect x="30.5" y="10.5" width="100" height="120" rx="8" fill="white" />
                <path
                  d="M89 11.5H38.5C34.0817 11.5 30.5 15.0817 30.5 19.5V123.5C30.5 127.918 34.0817 131.5 38.5 131.5H122.5C126.918 131.5 130.5 127.918 130.5 123.5V19.5C130.5 15.0817 126.918 11.5 122.5 11.5H104"
                  stroke="#36394D"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M94.5 11.5H98.5" stroke="#36394D" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M60.5 43.5H100.763"
                  stroke="#36394D"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M66.0261 49.0261H95.2366"
                  stroke="#36394D"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <rect x="58" y="67.5" width="46" height="32.0357" rx="6" fill="white" />
                <rect
                  x="59"
                  y="68.5"
                  width="44"
                  height="30.0357"
                  rx="5"
                  stroke="#36394D"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                />
                <line
                  x1="58"
                  y1="76.3572"
                  x2="102.357"
                  y2="76.3572"
                  stroke="#36394D"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                />
                <path
                  d="M64.5 90.5L71.5 90.5"
                  stroke="#36394D"
                  strokeOpacity="0.45"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="102.5" cy="96" r="13.5" fill="white" />
                <circle cx="102.5" cy="96" r="12.5" stroke="#36394D" strokeOpacity="0.45" strokeWidth="2" />
                <path
                  d="M107.167 92.5657C107.49 92.896 107.49 93.4314 107.167 93.7615L101.634 99.4342C101.311 99.7643 100.789 99.7643 100.467 99.4342L97.8326 96.7337C97.5104 96.4036 97.5104 95.8681 97.8326 95.538C98.1547 95.2077 98.677 95.2077 98.9991 95.538L101.05 97.6405L106.001 92.5657C106.323 92.2356 106.845 92.2356 107.167 92.5657Z"
                  fill="#F23D00"
                />
              </svg>
            </div>
            <h1 className="h3 font-bold">{t('title')}</h1>
            <p className="text-lg">{t('description', { email: user.email })}</p>

            <TrustPilot />

            <p>{t('click_below_to_account_your_link')}</p>
            <Link href={ROUTES.MEMBER.ONBOARDING.STEP_1}>
              <Button type="button" className="w-full" size="lg">
                {t('account_link')}
              </Button>
            </Link>
          </div>
        </main>
      </FunnelLayout>
    </>
  );
};

export default ThankYouPage;
