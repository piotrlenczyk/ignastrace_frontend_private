'use client';

import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

import { IconCheck } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';

type Step = {
  number: number;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
};

type UpsellProgressStepsProps = {
  currentStep: number;
  className?: string;
};

const UpsellProgressSteps = ({ currentStep, className }: UpsellProgressStepsProps) => {
  const t = useTranslations('pages.reverse_lookup.components.upsell_progress_steps');

  const steps: Omit<Step, 'status'>[] = [
    { number: 1, label: t('create_account') },
    { number: 2, label: t('pdf_export') },
    { number: 3, label: t('data_breach') },
    { number: 4, label: t('sex_offenders') },
    { number: 5, label: t('access_report') },
  ];

  const stepsWithStatus: Step[] = steps.map(step => ({
    ...step,
    status: step.number < currentStep ? 'completed' : step.number === currentStep ? 'current' : 'upcoming',
  }));

  return (
    <div className={cn('w-full mt-6 mb-8', className)}>
      <div className="mx-auto grid max-w-screen-sm auto-cols-fr grid-flow-col px-1">
        {stepsWithStatus.map((step, index) => (
          <Fragment key={step.number}>
            {/* Circle indicator with label */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center border-[1.5px] rounded-full bg-transparent',
                  step.status === 'completed' && 'bg-secondary border-secondary',
                  step.status === 'current' && 'border-secondary',
                  step.status === 'upcoming' && 'border-gray-500',
                )}
              >
                {step.status === 'completed'
                  ? (
                      <IconCheck className="size-4 text-white" />
                    )
                  : (
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          step.status === 'current' ? 'text-secondary' : 'text-weak',
                        )}
                      >
                        {step.number}
                      </span>
                    )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'hidden lg:block text-xs text-center max-w-[60px]',
                  step.status === 'upcoming' ? 'text-weak' : 'text-regular',
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {index < stepsWithStatus.length - 1 && (
              <div
                className={cn(
                  'h-0.5 mt-3 w-full',
                  stepsWithStatus[index + 1]?.status === 'completed' || stepsWithStatus[index + 1]?.status === 'current'
                    ? 'bg-secondary'
                    : 'bg-stroke-weak',
                )}
              />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default UpsellProgressSteps;
