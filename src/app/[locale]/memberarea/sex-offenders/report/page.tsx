import { redirect } from 'next/navigation';

import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { getUser } from '@/libs/subscription';
import { getSexOffenderSearchReport } from '@/server/getters/sex-offender-search.getters';
import { getServerSession } from '@/server/session/session.utils';
import { firstValue } from '@/utils/search-params';

import { SexOffenderSearchReportContent } from './report-content';

const SexOffenderSearchReportPage = async (props: PageProps<'/[locale]/memberarea/sex-offenders/report'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const searchReportId = firstValue(searchParams.id);

  if (!searchReportId) {
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

  /*
   * A report that is not the caller's answers 404, deliberately the same status as
   * one that does not exist — so a link made before the cutover, whose identifier
   * the new upstream never issued, reaches the error boundary rather than
   * somebody else's record. Nothing here classifies it.
   */
  const [record, user] = await Promise.all([getSexOffenderSearchReport(searchReportId), getUser()]);

  return (
    <ProductLayout>
      <SexOffenderSearchReportContent record={record} user={user} />
    </ProductLayout>
  );
};

export default SexOffenderSearchReportPage;
