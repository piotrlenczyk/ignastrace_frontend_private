'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconLoaderCircle, IconLocationMy } from '@/components/ui/icon/icons';
import { Link } from '@/libs/i18n-routing';
import type { Route } from '@/types/routes';

export const SearchCompleteContent = ({ phoneNumber, nextStepURL }: { phoneNumber: string; nextStepURL: Route }) => {
  const t = useTranslations('pages.loader.step_2');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClick = () => {
    setIsSubmitting(true);
  };

  return (
    <main className="s-main funnel-container-located funnel-container relative animate-fade-in animation-duration-1000">
      <section className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="search-located-bg z-10 container grid items-center justify-center gap-5 pb-2">
          <div className="lg:w-[336px]">
            <header className="flex flex-col items-center justify-center">
              <div className="brand-icon mb-4">
                <IconLocationMy size="large" />
              </div>
              <h1 className="h2 mb-2 text-center font-bold">{t('title')}</h1>
              <h2 className="h3 font-bold text-primary">{phoneNumber}</h2>
            </header>
            <div className="hidden flex-col items-center justify-center gap-6 lg:mt-6 lg:flex">
              <p className="text-center text-lg antialiased">{t('subtitle')}</p>
              <Button className="mx-auto" size="lg" asChild>
                <Link href={nextStepURL} onClick={handleClick}>
                  {t('cta')}
                  {isSubmitting ? <IconLoaderCircle size="large" className="animate-spin" /> : ''}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`
          sticky bottom-0 flex w-full flex-col items-center justify-center gap-5 rounded-t-3xl bg-white px-4 py-6
          lg:hidden
        `}
        style={{
          boxShadow: '10px 12px 48px 0px #00000040, 0px 4px 12px 0px #0000004D, 8px 16px 20px 0px #00000026',
        }}
      >
        <p className="text-center text-lg antialiased">{t('subtitle')}</p>
        <Button className="mx-auto w-full" size="lg" asChild>
          <Link href={nextStepURL} onClick={handleClick}>
            {t('cta')}
            {isSubmitting ? <IconLoaderCircle size="large" className="animate-spin" /> : ''}
          </Link>
        </Button>
      </div>
    </main>
  );
};
