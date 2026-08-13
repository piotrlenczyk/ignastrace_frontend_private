import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { formatPhoneNumber } from '@/hooks/format-phone-number';

import { SignUpForm } from './components/sign-up-form';

const SignUpPage = async () => {
  const t = await getTranslations('pages.loader_complete');

  const phoneNumber = await getFunnelPhone();
  const formattedNumber = formatPhoneNumber(phoneNumber);

  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
    noSubscriptionRoute: formattedNumber.valid ? ROUTES.CHECKOUT : ROUTES.HOME,
  });

  const title = t.rich('title', {
    brandColor: () => (
      <mark
        className="h2 block bg-transparent leading-tight whitespace-nowrap text-secondary"
      >
        {formattedNumber.number}
      </mark>
    ),
    phoneNumber: () => <span className="whitespace-nowrap">{formattedNumber.number}</span>,
  });

  return (
    <FunnelLayout>
      <main className="s-main animate-fade-in px-6 py-8 animation-duration-1000">
        <div className="container-small flex flex-col items-center gap-8 text-center">
          <h1 className="h3 font-bold">{title}</h1>
          <SignUpForm phoneNumber={formattedNumber.number} />
        </div>
      </main>
    </FunnelLayout>
  );
};

export default SignUpPage;
