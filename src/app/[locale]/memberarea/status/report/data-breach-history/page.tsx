import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getUser } from '@/libs/subscription';
import { getDataBreachDetail } from '@/server/getters/reverse-lookup.getters';
import { getServerSession } from '@/server/session/session.utils';
import { firstValue } from '@/utils/search-params';

import { ReportDetails } from './components/report-details';

/*
 * One request where there were two. The data-breach endpoint carries the phone
 * and the report's first photo alongside the breaches, and it is its own gate, so
 * the report read that existed only to supply one boolean has nothing left to do.
 */
export default async function DataBreachHistoryPage(
  props: PageProps<'/[locale]/memberarea/status/report/data-breach-history'>,
) {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const reportId = firstValue(searchParams.id);

  if (!reportId) {
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

  const [dataBreach, user] = await Promise.all([getDataBreachDetail(reportId), getUser()]);

  /* The gate moved from a flag in the response to the refusal itself; a member
   * without the upselling still goes home. */
  if (dataBreach.outcome === 'not-unlocked') {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  const { phone, photoUrl, dataLeaks } = dataBreach.data;

  return <ReportDetails user={user} dataLeaks={dataLeaks} photo={photoUrl} phone={phone} reportId={reportId} />;
}
