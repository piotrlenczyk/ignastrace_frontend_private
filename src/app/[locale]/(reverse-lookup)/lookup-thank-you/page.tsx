import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { FunnelUpsellRecordEnd } from '@/components/funnel-upsell-record-end';
import GTMPurchaseEvent from '@/components/gtm-purchase-event';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { Link } from '@/libs/i18n-routing';
import { redirectIfAuthenticated } from '@/libs/subscription';
import { getUser } from '@/libs/subscription';
import { reportOrderConfirmed } from '@/server/analytics/klaviyo.events';
import { getFunnelPurchaseEvent } from '@/server/getters/funnel-purchase-event.getters';
import { getServerSession } from '@/server/session/session.utils';

import TrustPilot from './_components/trustPilot';

const ThankYouPage = async () => {
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.REVERSE_LOOKUP.HOME);
  }

  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  await redirectIfAuthenticated({
    endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    noSubscription: formattedNumber.valid ? ROUTES.REVERSE_LOOKUP.CHECKOUT : ROUTES.REVERSE_LOOKUP.HOME,
  });

  const t = await getTranslations('pages.reverse_lookup.thank_you');
  const user = await getUser();

  /*
   * The end of a reverse-lookup run, which reports what its three upsell steps
   * actually charged for — nothing at all for a visitor who skipped every one of
   * them. What the mocked membership answered here was one invented amount for
   * everybody who reached this screen, refusals included; ADR 0037 records the
   * change.
   */
  const purchaseEvent = await getFunnelPurchaseEvent('upsells');

  reportOrderConfirmed();

  return (
    <>
      {purchaseEvent ? <GTMPurchaseEvent {...purchaseEvent} userId={user.id} email={user.email ?? ''} /> : null}
      <FunnelUpsellRecordEnd />

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
            <p className="text-lg">{t('description', { email: user.email ?? '' })}</p>

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
