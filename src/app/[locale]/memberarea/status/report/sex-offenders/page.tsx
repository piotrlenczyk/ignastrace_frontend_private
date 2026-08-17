import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import { getUser } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

import { ReportDetails } from './components/report-details';

const SexOffendersPage = async (props: PageProps<'/[locale]/memberarea/status/report/sex-offenders'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  if (!searchParams?.id) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const api = await getApi();

  const [sexOffenderData, user] = await Promise.all([
    api.get<SexOffenderData>(`/sex_offenders_data/${searchParams.id}`),
    getUser(),
  ]);

  if (!sexOffenderData.upsell_purchased) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  return <ReportDetails sexOffenderData={sexOffenderData} user={user} />;
};

export default SexOffendersPage;
