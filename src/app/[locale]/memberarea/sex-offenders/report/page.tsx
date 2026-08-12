import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import type { SexOffenderData } from '@/types/sex-offenders.types';
import type { User } from '@/types/user';

import { SexOffenderSearchReportContent } from './report-content';

const SexOffenderSearchReportPage = async ({ searchParams }: { searchParams?: { id?: string } }) => {
  const session = await auth();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  if (!searchParams?.id) {
    redirect(ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME);
  }

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: ROUTES.CHECKOUT,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const api = await getApi();

  const [sexOffenderData, user] = await Promise.all([
    api.get<SexOffenderData>(`/sex_offender_search_reports/${searchParams.id}`),
    api.get<User>('/user?expand=purchase_info'),
  ]);

  return (
    <ProductLayout>
      <SexOffenderSearchReportContent sexOffenderData={sexOffenderData} user={user} />
    </ProductLayout>
  );
};

export default SexOffenderSearchReportPage;
