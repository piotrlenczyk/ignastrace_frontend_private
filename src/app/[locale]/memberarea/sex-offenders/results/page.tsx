import { redirect } from 'next/navigation';

import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import { getServerSession } from '@/server/session/session.utils';
import type { SexOffenderSearch } from '@/types/sex-offenders.types';

import { SexOffenderSearchResults } from './results-content';

const SexOffenderSearchResultsPage = async (props: PageProps<'/[locale]/memberarea/sex-offenders/results'>) => {
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
  const search = await api.get<SexOffenderSearch>(`/sex_offender_searches/${searchParams.id}`);

  return (
    <ProductLayout>
      <SexOffenderSearchResults search={search} />
    </ProductLayout>
  );
};

export default SexOffenderSearchResultsPage;
