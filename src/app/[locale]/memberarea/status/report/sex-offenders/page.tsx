import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import type { SexOffenderData } from '@/types/sex-offenders.types';
import type { User } from '@/types/user';

import { ReportDetails } from './components/report-details';

const SexOffendersPage = async (props: PageProps<'/[locale]/memberarea/status/report/sex-offenders'>) => {
  const searchParams = await props.searchParams;
  const session = await auth();
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
    api.get<SexOffenderData>(
      `/sex_offenders_data/${searchParams.id}`,
    ),
    api.get<User>('/user?expand=purchase_info'),
  ]);

  if (!sexOffenderData.upsell_purchased) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  return (
    <ReportDetails sexOffenderData={sexOffenderData} user={user} />
  );
};

export default SexOffendersPage;
