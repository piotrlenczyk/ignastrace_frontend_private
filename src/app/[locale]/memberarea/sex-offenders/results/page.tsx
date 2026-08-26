import { redirect } from 'next/navigation';

import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { getSexOffenderSearch } from '@/server/getters/sex-offender-search.getters';
import { getServerSession } from '@/server/session/session.utils';
import { firstValue } from '@/utils/search-params';

import { SexOffenderSearchResults } from './results-content';

const SexOffenderSearchResultsPage = async (props: PageProps<'/[locale]/memberarea/sex-offenders/results'>) => {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const searchId = firstValue(searchParams.id);

  if (!searchId) {
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

  const search = await getSexOffenderSearch(searchId);

  return (
    <ProductLayout>
      <SexOffenderSearchResults search={search} />
    </ProductLayout>
  );
};

export default SexOffenderSearchResultsPage;
