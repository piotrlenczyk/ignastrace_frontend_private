import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { AnimatedLink } from '@/components/navigation/components/animated-link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { getSubscriptionRedirect } from '@/libs/subscription';
import { getServerSession } from '@/server/session/session.utils';

import { OnboardingSteps } from './components/onboarding-steps';

export default async function MemberAreaOnboardingStep1Page(
  props: PageProps<'/[locale]/memberarea/[onboarding-step]'>,
) {
  const params = await props.params;
  const session = await getServerSession();
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

  const lastLink = phoneNumber ? ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING : ROUTES.MEMBER.FIND_BY_NUMBER.HOME;

  const links = [ROUTES.MEMBER.ONBOARDING.STEP_2, ROUTES.MEMBER.ONBOARDING.STEP_3, lastLink];

  const step = params['onboarding-step'];
  const validSteps = ['onboarding-step-1', 'onboarding-step-2', 'onboarding-step-3'];

  if (!validSteps.includes(step)) {
    notFound();
  }
  const stepNumber = Number.parseInt(step.slice(-1), 10) as 1 | 2 | 3;

  const t = await getTranslations(`pages.onboarding_step${stepNumber}`);

  return (
    <FunnelLayout>
      <main className="s-main grid h-full animate-fade-in px-6 py-4 animation-duration-1000">
        <div className="container-small flex flex-col justify-between gap-4 text-center md:justify-normal">
          <div className="min-h-[510px] md:min-h-[600px]">
            <header className="mt-5 mb-8">
              <Image
                src={`/images/onboarding/step-${stepNumber}.jpg`}
                className="mx-auto mb-8 animate-fade-in object-fill"
                width={345}
                height={280}
                role="presentation"
                alt=""
              />
              <h1 className="mb-2 h3 font-bold">{t('title')}</h1>
              <p className="min-h-24">{t('body')}</p>
            </header>

            <Button size="lg" className="w-full" asChild>
              <AnimatedLink href={links[stepNumber - 1]!}>{t('cta')}</AnimatedLink>
            </Button>
          </div>
          <OnboardingSteps currentStep={stepNumber} />
        </div>
      </main>
    </FunnelLayout>
  );
}
