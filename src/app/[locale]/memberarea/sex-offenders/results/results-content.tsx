'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@/components/ui/icon/icons';
import { IconLocationPinCheck } from '@/components/ui/icon/icons/LocationPinCheck';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import type { SexOffenderSearch } from '@/types/sex-offenders.types';

import { SexOffenderSearchPurchase } from './sex-offenders-search-purchase';

export const SexOffenderSearchResults = ({ search }: { search: SexOffenderSearch }) => {
  const t = useTranslations('pages.sex_offenders_search.results');
  const tPage = useTranslations('pages.sex_offenders_search');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  if (search.matches.length === 0) {
    return (
      <main className="flex flex-1 flex-col px-4 pt-6 lg:p-6">
        <h1 className="h3 font-bold">{tPage('title')}</h1>
        <div className="container-content flex flex-1 flex-col items-center justify-center gap-6 pb-24 text-center">
          <Image
            src="/images/sex-offenders-not-found.png"
            alt=""
            width={280}
            height={280}
          />
          <h2 className="h3 font-bold">{t('empty_title')}</h2>
          <Button asChild>
            <Link href={ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME}>{t('search_again')}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:p-6">
      <h1 className="h3 w-full font-bold">{tPage('title')}</h1>
      <div className="container-content flex flex-1 flex-col items-center gap-4 pb-24 lg:justify-center">
        <div className="flex w-full flex-col gap-1">
          <h2 className="h4 font-bold">{t('results_found', { count: search.matches.length })}</h2>
          <p className="text-weak">{t('results_found_subtitle')}</p>
        </div>

        <fieldset className="flex w-full flex-col gap-2">
          <legend className="sr-only">{t('results_found_subtitle')}</legend>
          {search.matches.map(match => (
            <label
              key={match.candidate_index}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-3 text-left cursor-pointer',
                selectedIndex === match.candidate_index ? 'border-primary bg-primary-50' : 'border-stroke-weak',
              )}
            >
              <input
                type="radio"
                name="candidate"
                value={match.candidate_index}
                checked={selectedIndex === match.candidate_index}
                onChange={() => setSelectedIndex(match.candidate_index)}
                className={cn(
                  'size-5 shrink-0 appearance-none rounded-full border-2 border-stroke-weak bg-white',
                  'checked:border-[5px] checked:border-primary',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              />
              {match.photo_url && (
                <Image
                  src={match.photo_url}
                  alt={`${match.first_name} ${match.last_name}`}
                  width={60}
                  height={60}
                  className="size-[60px] shrink-0 rounded-xl object-cover"
                />
              )}
              <div>
                <p className="text-lg font-bold lg:text-2xl">{`${match.first_name} ${match.last_name}`}</p>
                <p className="flex items-center gap-1 text-sm text-weak">
                  <IconLocationPinCheck size="small" className="shrink-0" />
                  {[match.address, match.city, match.state, 'USA'].filter(Boolean).join(', ')}
                </p>
              </div>
            </label>
          ))}
        </fieldset>

        <div className="flex w-full flex-col-reverse gap-4 lg:grid lg:grid-cols-2">
          <Button asChild variant="secondary">
            <Link href={ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME}>
              <IconArrowLeft size="small" className="mr-2" />
              {t('back')}
            </Link>
          </Button>
          <Button disabled={selectedIndex === null} onClick={() => setIsPurchaseOpen(true)}>
            {t('continue')}
          </Button>
        </div>
      </div>

      {selectedIndex !== null && (
        <SexOffenderSearchPurchase
          open={isPurchaseOpen}
          onOpenChange={setIsPurchaseOpen}
          sexOffenderSearchId={search.id}
          candidateIndex={selectedIndex}
        />
      )}
    </main>
  );
};
