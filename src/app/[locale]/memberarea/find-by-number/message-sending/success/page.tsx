import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import ProductLayout from '@/components/layouts/product-layout';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { Link } from '@/libs/i18n-routing';
import { getSession } from '@/server/session/session.server';

export default async function MessageSendingPage() {
  const session = await getSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const storedPhoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(storedPhoneNumber);

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: storedPhoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      activeSubscription: storedPhoneNumber ? undefined : ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const t = await getTranslations('pages.find_by_number_send_message_success');
  const tFindByNumber = await getTranslations('pages.find_by_number_send_message');

  const phoneNumber = t.rich('description', {
    strong: () => <strong className="font-bold whitespace-nowrap">{formattedNumber.number}</strong>,
    phoneNumber: () => formattedNumber.number,
  });

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="h3 font-bold">{tFindByNumber('find_by_number')}</h1>
        <div className="container-content flex flex-1 flex-col justify-center gap-8">
          <div className="globe">
            <div className="globe-map"></div>
          </div>
          <div className="grid gap-2">
            <h1 className="text-center h3 font-bold">{t('title')}</h1>
            <p className="text-center">{phoneNumber}</p>
          </div>
          <Button size="lg" asChild>
            <Link href={ROUTES.MEMBER.STATUS.HOME}>{t('cta')}</Link>
          </Button>
        </div>
      </main>
    </ProductLayout>
  );
}
