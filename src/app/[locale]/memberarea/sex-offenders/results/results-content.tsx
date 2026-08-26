'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import type { SexOffenderSearch } from '@/server/getters/sex-offender-search.getters';

import { SexOffenderSearchPurchase } from './sex-offenders-search-purchase';

/*
 * The same placeholder every absent field on this feature shows — written out
 * literally by the record screen's cards, and named here because a candidate's
 * name is composed rather than read straight off a field.
 *
 * A registry that named a candidate incompletely — or not at all — still produces
 * a row the member can select and unlock, because the record behind it is
 * addressed by its index and not by its name.
 */
const ABSENT = '--';

const candidateName = ({ firstName, lastName }: SexOffenderSearch['matches'][number]) =>
  [firstName, lastName].filter(Boolean).join(' ') || ABSENT;

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
          <Image src="/images/sex-offenders-not-found.png" alt="" width={280} height={280} />
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
      <h1 className="w-full h3 font-bold">{tPage('title')}</h1>
      <div className="container-content flex flex-1 flex-col items-center gap-4 pb-24 lg:justify-center">
        <div className="flex w-full flex-col gap-1">
          <h2 className="h4 font-bold">{t('results_found', { count: search.matches.length })}</h2>
          <p className="text-weak">{t('results_found_subtitle')}</p>
        </div>

        <fieldset className="flex w-full flex-col gap-2">
          <legend className="sr-only">{t('results_found_subtitle')}</legend>
          {search.matches.map((match) => (
            <label
              key={match.candidateIndex}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left',
                selectedIndex === match.candidateIndex ? 'border-primary bg-primary-50' : 'border-stroke-weak',
              )}
            >
              <input
                type="radio"
                name="candidate"
                value={match.candidateIndex}
                checked={selectedIndex === match.candidateIndex}
                onChange={() => setSelectedIndex(match.candidateIndex)}
                className={cn(
                  'size-5 shrink-0 appearance-none rounded-full border-2 border-stroke-weak bg-white',
                  'checked:border-[5px] checked:border-primary',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
                  'focus-visible:ring-offset-2',
                )}
              />
              {match.photoUrl && (
                /*
                 * The name is beside the photo already, and a candidate the
                 * registry named incompletely would put a placeholder into a
                 * screen reader. Empty alternative text says "decorative", which
                 * is what this is.
                 */
                <Image
                  src={match.photoUrl}
                  alt=""
                  width={60}
                  height={60}
                  className="size-[60px] shrink-0 rounded-xl object-cover"
                />
              )}
              <div>
                <p className="text-lg font-bold lg:text-2xl">{candidateName(match)}</p>
                <p className="flex items-center gap-1 text-sm text-weak">
                  <Icon name="pin-location" className="size-3 shrink-0" />
                  {[match.address, match.city, match.state, 'USA'].filter(Boolean).join(', ')}
                </p>
              </div>
            </label>
          ))}
        </fieldset>

        <div className="flex w-full flex-col-reverse gap-4 lg:grid lg:grid-cols-2">
          <Button asChild variant="secondary">
            <Link href={ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.HOME}>
              <Icon name="arrow-left" className="mr-2 size-3" />
              {t('back')}
            </Link>
          </Button>
          <Button disabled={selectedIndex === null} onClick={() => setIsPurchaseOpen(true)}>
            {t('continue')}
          </Button>
        </div>
      </div>

      {selectedIndex !== null && (
        /*
         * Keyed by the candidate, so choosing a different one starts a fresh
         * purchase: the report identifier an unlock answered with belongs to the
         * candidate it unlocked, and nothing of it should survive into another.
         */
        <SexOffenderSearchPurchase
          key={selectedIndex}
          open={isPurchaseOpen}
          onOpenChange={setIsPurchaseOpen}
          searchId={search.id}
          candidateIndex={selectedIndex}
        />
      )}
    </main>
  );
};
