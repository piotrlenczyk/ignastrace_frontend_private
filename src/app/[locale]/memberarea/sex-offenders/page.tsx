import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getSession } from '@/server/session/session.server';

import { SexOffenderSearchForm } from './search-form';

const SexOffendersSearchPage = async () => {
  const session = await getSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
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

  const t = await getTranslations('pages.sex_offenders_search');

  return (
    <ProductLayout>
      <main className="flex flex-1 flex-col gap-6 px-4 pt-6 lg:p-6">
        <h1 className="h3 font-bold">{t('title')}</h1>
        <div className="container-content flex flex-1 flex-col items-center gap-8 pb-24 lg:justify-center">
          <SexOffenderSearchForm />
        </div>
      </main>
    </ProductLayout>
  );
};

export default SexOffendersSearchPage;
