import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import { auth } from '@/auth';
import ProductLayout from '@/components/layouts/product-layout';
import { Button } from '@/components/ui/button';
import { IconCheckCircleAlt03 } from '@/components/ui/icon/icons/CheckCircleAlt03';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { Link } from '@/libs/i18n-routing';
import { getApi } from '@/libs/server/api';
import type { Location } from '@/types/location';
import type { Route } from '@/types/routes';

import { CopyToClipBoard } from './components/copy-to-clipboard';

export default async function Page({ searchParams }: { searchParams: { id: string } }) {
  const session = await auth();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const id = searchParams?.id;

  if (!id) {
    redirect(ROUTES.MEMBER.FIND_BY_LINK.HOME);
  }

  const phoneNumber = await getFunnelPhone();

  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  }) as Route;

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const api = await getApi();
  const { link } = await api.get<Location>(`/locations/${id}`);

  const t = await getTranslations('pages.find_by_link_success');
  const tFindByLink = await getTranslations('pages.find_by_link');
  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="h3 font-bold">{tFindByLink('find_by_link')}</h1>
        <div className="container-content flex flex-1 flex-col justify-center gap-4">
          <div className="brand-icon">
            <IconCheckCircleAlt03 size="large" />
          </div>
          <h1 className="h3 font-bold">
            { t('title')}
          </h1>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-strong">
              {t('subtitle')}
            </h2>
            <p className="text-sm text-strong">
              { t('body')}
            </p>
          </div>
          <div
            className="input-animated-border input-animated-border-secondary flex rounded-xl p-1"
          >
            <input
              className="flex-1 text-ellipsis px-3 text-sm text-strong"
              type="text"
              readOnly
              value={link}
            />
            <CopyToClipBoard content={link} />
          </div>
          <Button size="lg" asChild>
            <Link href={ROUTES.MEMBER.STATUS.HOME}>
              {t('statusCTA')}
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href={ROUTES.MEMBER.FIND_BY_LINK.HOME}>
              {t('generateNewCTA')}
            </Link>
          </Button>
        </div>
      </main>
    </ProductLayout>
  );
}
