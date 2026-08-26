import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { ACTIVITY_FEED_PAGE_SIZE, getActivityFeed } from '@/server/getters/activity.getters';
import { getServerSession } from '@/server/session/session.utils';

import { toActivityRows } from './_page/activity-list';
import { ActivityRows } from './_page/components/activity-rows';
import { EmptyState } from './_page/components/empty-state';

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

  const t = await getTranslations('pages.status');
  const { data, nextCursor } = await getActivityFeed();
  const rows = toActivityRows(data);

  return (
    <div className="flex flex-col px-4 lg:p-6">
      <h1 className="h3 font-bold">{t('title')}</h1>
      <p className="text-lg text-strong">{t('description')}</p>

      {rows.length > 0 ? (
        <ActivityRows rows={rows} nextCursor={nextCursor ?? undefined} pageSize={ACTIVITY_FEED_PAGE_SIZE} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
};

export default StatusPage;
