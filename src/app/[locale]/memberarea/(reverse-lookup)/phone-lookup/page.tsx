import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import ProductLayout from '@/components/layouts/product-layout';
import { RequestCounter } from '@/components/request-counter';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/hooks/get-subscription-redirect';
import { getApi } from '@/libs/server/api';
import { getFeatures } from '@/libs/server/feature-flags';
import { getUserCountry } from '@/libs/server/user-country';
import { getServerSession } from '@/server/session/session.utils';
import type { RequestCountData } from '@/types/request_count_data';

import { ReversePhoneLookupForm } from './components/reverse-phone-lookup-form';

export default async function FindByNumberPage() {
  const country = await getUserCountry();
  const t = await getTranslations('pages.reverse_lookup.member_area.phone_lookup');

  const session = await getServerSession();
  const isAuthenticated = !!session;
  const api = await getApi();

  if (!isAuthenticated) {
    redirect(ROUTES.HOME);
  }

  const features = await getFeatures();
  const { ENABLE_REVERSE_LOOKUP: enableReverseLookup } = features;

  if (!enableReverseLookup) {
    redirect(ROUTES.MEMBER.STATUS.HOME);
  }

  const phoneNumber = await getFunnelPhone();
  const redirectUrl = await getSubscriptionRedirect({
    routes: {
      noSubscription: phoneNumber ? ROUTES.CHECKOUT : ROUTES.HOME,
      endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
    },
  });

  const requestCountData = await api.get<RequestCountData>(`/reverse_lookups/usage_count`);

  if (redirectUrl) {
    redirect(redirectUrl);
  }

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
