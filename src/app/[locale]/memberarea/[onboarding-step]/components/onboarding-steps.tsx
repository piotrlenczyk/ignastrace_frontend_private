import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useTranslations } from 'next-intl';

import { AnimatedLink } from '@/components/navigation/components/animated-link';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/libs/utils';

const links = [ROUTES.MEMBER.ONBOARDING.STEP_1, ROUTES.MEMBER.ONBOARDING.STEP_2, ROUTES.MEMBER.ONBOARDING.STEP_3];

export const OnboardingSteps = ({ currentStep = 1, className }: { currentStep?: number; className?: string }) => {
  const t = useTranslations('pages.onboarding.navigation');

  const filledStepCSS = 'bg-secondary';
  const emptyStepCSS = 'bg-weak shadow-[0px_1px_4px_0px_rgba(0,0,0,0.08)_inset]';

  return (
    <nav className={cn('mx-auto flex h-2 w-[200px] gap-2 [grid-area:footer]', className)}>
      {links.map((link, i) => {
        const isCurrentStep = i + 1 === currentStep;
        const Comp = isCurrentStep ? 'div' : AnimatedLink;

        return links[i] ? (
          <Comp
            key={link}
            href={link}
            className={cn('flex-1 rounded-sm', i < currentStep ? filledStepCSS : emptyStepCSS)}
            aria-current={isCurrentStep ? 'page' : undefined}
          >
            <VisuallyHidden>{t(`step_${i + 1}` as any)}</VisuallyHidden>
          </Comp>
        ) : null;
      })}
    </nav>
  );
};
