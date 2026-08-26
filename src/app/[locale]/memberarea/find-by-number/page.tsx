import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { PhoneInput } from '@/components/homepage/phoneInput';
import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

export default async function FindByNumberPage() {
  const country = (await getServerSettings()).countryCode;
  const t = await getTranslations('components.phone_input');
  const tFindByNumber = await getTranslations('pages.find_by_number_send_message');

  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const phoneNumber = await getFunnelPhone();
  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="h3 font-bold">{tFindByNumber('find_by_number')}</h1>
        <div className="container-content flex flex-1 flex-col justify-center gap-4">
          <h2 className="h3 font-bold">{t('label')}</h2>
          <PhoneInput
            defaultCountry={country}
            destinationUrl={ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING}
            hasLgBackground={false}
          />
          <ul className="mt-2 list-disc pl-4 text-sm lg:mt-4">
            <li>{tFindByNumber('extra_info.bullet_1')}</li>
            <li>{tFindByNumber('extra_info.bullet_2')}</li>
          </ul>
        </div>
      </main>
    </ProductLayout>
  );
}
