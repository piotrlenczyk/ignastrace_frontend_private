import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import GTMPurchaseEvent from '@/components/gtm-purchase-event';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { Link } from '@/libs/i18n-routing';
import { getApi } from '@/libs/server/api';
import { getSession } from '@/server/session/session';
import type { User } from '@/types/user';

import TrustPilot from './_components/trustPilot';

const ThankYouPage = async () => {
  const session = await getSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.REVERSE_LOOKUP.HOME);
  }

  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  await redirectIfAuthenticated({
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    noSubscriptionRoute: formattedNumber.valid ? ROUTES.REVERSE_LOOKUP.CHECKOUT : ROUTES.REVERSE_LOOKUP.HOME,
  });

  const t = await getTranslations('pages.reverse_lookup.thank_you');
  const api = await getApi();
  const user = await api.get<User>('/user?expand=purchase_info');

  await Promise.all([api.post('/user/send_order_confirm_email', {}), api.post('/klaviyo/order_confirmed')]);

  return (
    <>
      <GTMPurchaseEvent
        event="upsell_purchase"
        userId={user.id}
        email={user.email}
        value={(user.purchase_info?.upsellings_price || 0) / 100}
        currency={user.currency.toUpperCase()}
      />

      <FunnelLayout isReverseLookup>
        <main className="s-main flex full-main items-center p-6">
          <div className="container-small flex flex-col items-center gap-6 text-center">
            <div className="flex justify-center">
              <Image
                src="/images/reverse-lookup/payment-success.png"
                alt="Payment success"
                width={160}
                height={160}
                priority
              />
            </div>
            <h1 className="h3 font-bold">{t('title')}</h1>
            <p className="text-lg">{t('description', { email: user.email })}</p>

            <TrustPilot />

            <p>{t('click_below_to_account_your_link')}</p>
            <Link href={ROUTES.MEMBER.STATUS.HOME}>
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
