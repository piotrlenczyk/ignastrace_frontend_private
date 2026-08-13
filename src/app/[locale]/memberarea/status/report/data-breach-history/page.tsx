import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import type { ReverseLookup } from '@/types/reverse-lookup.types';
import type { ReverseLookupDataLeakResponse } from '@/types/reverse-lookup-data-leaks.types';
import type { User } from '@/types/user';
import { firstValue } from '@/utils/search-params';

import { ReportDetails } from './components/report-details';

export default async function DataBreachHistoryPage(props: PageProps<'/[locale]/memberarea/status/report/data-breach-history'>) {
  const searchParams = await props.searchParams;
  const session = await auth();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const reverseLookupId = firstValue(searchParams.id);

  if (!reverseLookupId) {
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

  const [reverseLookupDataLeaksResponse, reverseLookup, user] = await Promise.all([
    api.get<ReverseLookupDataLeakResponse>(
      `/reverse_lookups/${reverseLookupId}/data_leaks`,
    ),
    api.get<ReverseLookup>(
      `/reverse_lookups/${reverseLookupId}`,
    ),
    api.get<User>('/user?expand=purchase_info'),
  ]);

  if (!reverseLookup.reverse_lookup_data_leaks_upsell_purchased) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  return (
    <ReportDetails
      user={user}
      reverseLookupDataLeaks={reverseLookupDataLeaksResponse.reverse_lookup_data_leaks}
      photo={reverseLookupDataLeaksResponse.photo}
      phone={reverseLookupDataLeaksResponse.phone}
      reverseLookupId={reverseLookupId}
    />
  );
}
