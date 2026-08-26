import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import ProductLayout from '@/components/layouts/product-layout';
import { RequestCounter } from '@/components/request-counter';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { apiServerClient } from '@/network/api/apiServerClient';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';
import type { RequestCountData } from '@/types/request_count_data';

import { ReversePhoneLookupForm } from './components/reverse-phone-lookup-form';

export default async function FindByNumberPage() {
  const country = (await getServerSettings()).countryCode;
  const t = await getTranslations('pages.reverse_lookup.member_area.phone_lookup');

  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const { reverseLookupEnabled } = await getServerSettings();

  if (!reverseLookupEnabled) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
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

  /*
   * How much of the member's rolling daily report allowance is left, read
   * server-side on the screen that renders the form. Read the way the SMS compose
   * screen reads its dispatch count: take what the API answered, and fall back to
   * a spent-nothing count against the published limit when it answered nothing.
   *
   * Deliberately not put through `unwrapApiResponse`, and deliberately not allowed
   * to fail the render. The counter is decoration — the gate is the creation call,
   * which enforces the same window server-side — so an outage in it must not stop a
   * member doing the thing they came for. The twin screen reads its counter this
   * way, and two counters in one product reacting differently to one outage would
   * be worse than the inconsistency with the rule.
   */
  const { data } = await apiServerClient['/api/v1/reverse-lookup-reports/usage-count'].GET();

  const requestCountData: RequestCountData = data ?? { count: 0, limit: 5 };

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 lg:p-6">
        <div className="flex flex-col items-start gap-8">
          <h1 className="h3 font-bold">{t('phone_lookup')}</h1>
        </div>
        <div className="container-content flex flex-1 flex-col justify-center gap-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="h3 font-bold">{t('label')}</h1>
            <div className="flex items-center gap-1">
              <RequestCounter requestCountData={requestCountData} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Icon name="info" className="text-weak hover:text-black" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-black text-caption text-white"
                    align="end"
                    alignOffset={-8}
                  >
                    <TooltipArrow className="fill-black" />
                    {t('daily_limit')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <ReversePhoneLookupForm country={country} />
        </div>
      </main>
    </ProductLayout>
  );
}
