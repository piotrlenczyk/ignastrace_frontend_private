import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getUser } from '@/libs/subscription';
import { getSexOffenderDetail } from '@/server/getters/reverse-lookup.getters';
import { getServerSession } from '@/server/session/session.utils';
import { firstValue } from '@/utils/search-params';

import { InPreparation } from '../components/in-preparation';
import { ReportDetails } from './components/report-details';

/*
 * The record is addressed by the report and the owner it belongs to, not by a
 * record identifier: the new API publishes none, and the pair is the key both the
 * sectioned response's `ownersWithRecords` and the detail endpoint use.
 */
const SexOffendersPage = async (props: PageProps<'/[locale]/memberarea/status/report/sex-offenders'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const reportId = firstValue(searchParams.reportId);
  const ownerId = firstValue(searchParams.ownerId);

  if (!reportId || !ownerId) {
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

  const [record, user] = await Promise.all([getSexOffenderDetail(reportId, ownerId), getUser()]);

  /*
   * The gate is the refusal itself rather than a flag in the response, and it
   * sends the member where the flag-based one sent them.
   */
  if (record.outcome === 'not-unlocked') {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  if (record.outcome === 'in-preparation') {
    return <InPreparation />;
  }

  return <ReportDetails record={record.data} reportId={reportId} user={user} />;
};

export default SexOffendersPage;
