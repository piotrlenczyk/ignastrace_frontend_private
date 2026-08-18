import WebsiteLayout from '@/components/layouts/website-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { getTrialPricing } from '@/libs/pricing';
import { getUserCountry } from '@/libs/server/user-country';

import { PricingContent } from './_components/content';

export default async function PricingPage() {
  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  const country = await getUserCountry();
  const pricing = await getTrialPricing();

  return (
    <WebsiteLayout>
      <div className="s-main pb-10 lg:px-6">
        <PricingContent country={country} pricing={pricing} />
      </div>
    </WebsiteLayout>
  );
}
