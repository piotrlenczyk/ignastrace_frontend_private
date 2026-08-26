import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import ProductLayout from '@/components/layouts/product-layout';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { apiServerClient } from '@/network/api/apiServerClient';
import { getServerSession } from '@/server/session/session.utils';
import type { Route } from '@/types/routes';

import { CopyToClipBoard } from './components/copy-to-clipboard';

export default async function Page(props: PageProps<'/[locale]/memberarea/find-by-link/success'>) {
  const searchParams = await props.searchParams;
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  // A query string may repeat a key, and the id is one value — the first one.
  const [id] = [searchParams?.id].flat();

  if (!id) {
    redirect(ROUTES.MEMBER.FIND_BY_LINK.HOME);
  }

  const phoneNumber = await getFunnelPhone();

  const redirectUrl = (await getSubscriptionRedirect({
    routes: {
      noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  })) as Route;

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  /*
   * The Share link is read here rather than carried from the creation, because it
   * embeds the Consent link's opaque token — and a token in a query string ends up
   * in the browser's history. What arrives is the request's own id; the link is
   * fetched behind it.
   */
  const { data } = await apiServerClient['/api/v1/location-requests/{id}'].GET({ params: { path: { id } } });
  if (!data) {
    return null;
  }
  const { shareLink } = data;

  const t = await getTranslations('pages.find_by_link_success');
  const tFindByLink = await getTranslations('pages.find_by_link');
  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <h1 className="h3 font-bold">{tFindByLink('find_by_link')}</h1>
        <div className="container-content flex flex-1 flex-col justify-center gap-4">
          <div className="brand-icon">
            <Icon name="check-circle" />
          </div>
          <h1 className="h3 font-bold">{t('title')}</h1>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-strong">{t('subtitle')}</h2>
            <p className="text-sm text-strong">{t('body')}</p>
          </div>
          <div className="input-animated-border input-animated-border-secondary flex rounded-xl p-1">
            <input className="flex-1 px-3 text-sm text-ellipsis text-strong" type="text" readOnly value={shareLink} />
            <CopyToClipBoard content={shareLink} />
          </div>
          <Button size="lg" asChild>
            <Link href={ROUTES.MEMBER.STATUS.HOME}>{t('statusCTA')}</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href={ROUTES.MEMBER.FIND_BY_LINK.HOME}>{t('generateNewCTA')}</Link>
          </Button>
        </div>
      </main>
    </ProductLayout>
  );
}
