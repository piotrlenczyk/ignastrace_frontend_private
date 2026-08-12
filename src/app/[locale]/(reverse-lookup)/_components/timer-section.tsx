'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import React, { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { IconArrowRight, IconTimer } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { useCountdownTimer } from '@/hooks/use-countdown-timer';

const TimerSection: React.FC = () => {
  const t = useTranslations('pages.reverse_lookup.components.summary_report_card');
  const router = useRouter();

  const { formattedTime, isLoaded } = useCountdownTimer({
    initialMinutes: 10,
    storageKey: 'summary-countdown-timer',
    onComplete: useCallback(() => {
    }, []),
  });

  const timerDesktop = t.rich('timer_desktop', { mark: chunks => <mark className="text-brand">{chunks}</mark> });
  const timerMobile = t('timer_mobile');

  return (
    <div className="flex items-center justify-between gap-2 border-b border-amber-200 py-4 lg:py-6">
      <div className="flex items-center gap-2">
        <IconTimer className="size-6" />
        <p className="hidden md:block">{timerDesktop}</p>
        <p className="md:hidden">{timerMobile}</p>
        <div className="flex items-center gap-2">
          <span className="font-bold">
            {isLoaded ? formattedTime : '     '}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          className="px-3 md:px-8"
          onClick={() => router.push(ROUTES.REVERSE_LOOKUP.CHECKOUT)}
        >
          {/* Show arrow on mobile, text on desktop */}
          <span className="hidden text-lg md:inline">{t('continue')}</span>
          <IconArrowRight className="size-6 md:hidden" />
        </Button>
      </div>
    </div>
  );
};

export default React.memo(TimerSection);
