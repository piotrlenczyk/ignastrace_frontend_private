import { redirect } from 'next/navigation';

import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getApi } from '@/libs/server/api';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { getUser } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';
import type { SexOffenderData } from '@/types/sex-offenders.types';

import { SexOffenderSearchReportContent } from './report-content';

const SexOffenderSearchReportPage = async (props: PageProps<'/[locale]/memberarea/sex-offenders/report'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
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
    getUser(),
  ]);

  return (
    <ProductLayout>
      <SexOffenderSearchReportContent sexOffenderData={sexOffenderData} user={user} />
    </ProductLayout>
  );
};

export default SexOffenderSearchReportPage;
