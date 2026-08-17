import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import { getServerSession } from '@/server/session/session.utils';
import type { ServiceRequest } from '@/types/service-request';

import { EmptyState } from './_page/components/empty-state';
import { ServiceRequests } from './_page/components/service-requests';

const StatusPage = async () => {
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

  const api = await getApi();
  const t = await getTranslations('pages.status');
  const serviceRequests = await api.get<ServiceRequest[]>('/service_requests');

  return (
    <div className="flex flex-col px-4 lg:p-6">
      <h1 className="h3 font-bold">{t('title')}</h1>
      <p className="text-lg text-strong">{t('description')}</p>

      {serviceRequests.length > 0 ? <ServiceRequests serviceRequests={serviceRequests} /> : <EmptyState />}
    </div>
  );
};

export default StatusPage;
