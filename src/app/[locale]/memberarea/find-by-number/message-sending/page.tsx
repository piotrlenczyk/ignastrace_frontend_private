import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { auth } from '@/auth';
import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import type { RequestCountData } from '@/types/request_count_data';
import { firstValue } from '@/utils/search-params';

import { MessageSendingForm } from './components/form';

export default async function MessageSendingPage(props: PageProps<'/[locale]/memberarea/find-by-number/message-sending'>) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const isAuthenticated = !!session;
  const api = await getApi();

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const phoneNumber = firstValue(searchParams.phone) || (await getFunnelPhone());

  const formattedNumber = formatPhoneNumber(phoneNumber);

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      activeSubscription: phoneNumber ? undefined : ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const requestCountData = await api.get<RequestCountData>(`/locations/sms_count`);

  const t = await getTranslations('pages.find_by_number_send_message');

  if (!phoneNumber) {
    redirect(ROUTES.MEMBER.FIND_BY_NUMBER.HOME);
  }

  const title = t.rich('title', {
    brandColor: chunks => (
      <h1 className="h2 bg-transparent leading-snug whitespace-nowrap">{chunks}</h1>
    ),
    phoneNumber: formattedNumber.number,
  });

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="h3 font-bold">{t('find_by_number')}</h1>
        <div className="container-content flex flex-1 flex-col justify-center gap-8">
          <div className="h4 text-center font-bold">
            { title }
          </div>
          <MessageSendingForm rawPhoneNumber={phoneNumber} requestCountData={requestCountData} />
          <ul className="list-disc pl-4 text-sm">
            <li>{t('extra_info.bullet_1')}</li>
            <li>{t('extra_info.bullet_2')}</li>
          </ul>
        </div>
      </main>
    </ProductLayout>
  );
}
