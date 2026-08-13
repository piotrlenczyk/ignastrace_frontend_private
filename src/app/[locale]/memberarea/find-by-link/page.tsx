import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import ProductLayout from '@/components/layouts/product-layout';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getSession } from '@/server/session/session.server';

import { CreateCustomLinkForm } from './create-link-form';

const FindByLinkPage = async () => {
  const session = await getSession();
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

  const t = await getTranslations('pages.find_by_link');
  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="h3 font-bold">{t('find_by_link')}</h1>
        <div className="container-content flex flex-1 flex-col justify-center gap-4">
          <h1 className="h3 font-bold">{t('title')}</h1>
          <CreateCustomLinkForm />
          <aside className="rounded-lg bg-alternate p-6 text-strong lg:mt-4">
            <ol className="ml-5 list-decimal">
              <li>{t('steps.step1')}</li>
              <li>{t('steps.step2')}</li>
              <li>{t('steps.step3')}</li>
              <li>{t('steps.step4')}</li>
            </ol>
          </aside>
        </div>
      </main>
    </ProductLayout>
  );
};

export default FindByLinkPage;
