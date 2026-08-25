'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/libs/utils';
import type { SectionedReport } from '@/server/getters/reverse-lookup.getters';

import { useSectionedReportQuery } from '../_hooks/api/use-sectioned-report-query';
import { useSocialKindLabel } from '../report-enum-labels';
import { AlertInfo } from './alert-info';
import UpsellDialog from './upsell-dialog';

type SocialMedia = SectionedReport['socialMedia'];

const PossibleSocialMediaAccounts = ({
  className,
  socialMedia,
  reportId,
}: {
  className?: string;
  socialMedia: SocialMedia;
  reportId: string;
}) => {
  const t = useTranslations('pages.reverse_lookup.report.possible_social_media_accounts');
  const tSearching = useTranslations('pages.reverse_lookup.report.looking_for_more_profiles_dialog');
  const kindLabel = useSocialKindLabel();

  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  /*
   * The one browser-side read on this screen. It starts either because the
   * server-rendered section was already searching or because the member has just
   * unlocked it, and it stops on its own once the section says the search is done.
   */
  const { data } = useSectionedReportQuery(reportId, {
    enabled: socialMedia.state === 'PENDING' || justUnlocked,
  });

  const section: SocialMedia = data?.socialMedia ?? socialMedia;

  /*
   * In the `LOCKED` state the new API returns neither the accounts nor the handle
   * it searched by — on the reasoning that a handle is itself identifying
   * information about the subject — so a member who has not bought the upselling
   * sees the unlock prompt and nothing else. That is less than the legacy screen
   * showed them, and it is recorded as such rather than worked around.
   */
  const isLocked = section.state === 'LOCKED';
  const isSearching = section.state === 'PENDING';
  const accounts = section.accounts ?? [];
  const username = section.username;

  return (
    <>
      <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
        <h4 className="font-bold">{section.state === 'NO_RESULTS' ? t('title_empty') : t('title')}</h4>

        <AlertInfo>{t('info')}</AlertInfo>

        {section.state === 'NO_RESULTS' && (
          <AlertInfo
            className="border-amber-200 border-l-warning-stroke-strong bg-warning-fill"
            iconClassName="text-warning-stroke-strong"
          >
            {t('no_accounts_found')}
          </AlertInfo>
        )}

        {/* Progress is reported for the section rather than per account, so one
            note replaces the spinner each row used to carry. */}
        {isSearching && (
          <AlertInfo>
            <strong>{tSearching('title')}</strong> — {tSearching('description')}
          </AlertInfo>
        )}

        {accounts.map((account) => (
          <div
            key={account.id}
            className={`
              flex flex-col items-start gap-3 rounded-2xl border border-overlay-light p-4
              sm:flex-row sm:items-center
            `}
          >
            <div className="flex flex-1 items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-full border">
                <Icon name="globe" className={cn('size-6', account.kind === 'FACEBOOK' && 'text-[#0966FF]')} />
              </div>
              <div className="flex-1">
                <div className="leading-[24px]">
                  <p>
                    <span className="mr-1">{t('labels.source')}:</span>
                    <span className="text-lg font-bold">{kindLabel(account.kind)}</span>
                  </p>
                  <p>
                    <span className="mr-1">{t('labels.name')}:</span>
                    <span className="text-lg font-bold">{username}</span>
                  </p>
                </div>
              </div>
            </div>
            <Button variant="secondary" asChild>
              <a href={account.url} target="_blank" rel="noindex nofollow noopener noreferrer">
                {t('labels.opne_url')}
                <Icon name="open" className="size-4" />
              </a>
            </Button>
          </div>
        ))}

        {isLocked && (
          <div className="flex flex-col items-center rounded-2xl border border-primary-200 bg-primary-50 px-4 py-8">
            <h4 className="font-bold">{t('expand_search.title')}</h4>
            <p className="mt-2 text-sm text-weak">{t('expand_search.more_platforms')}</p>
            <div className="mt-5 flex gap-2">
              {Array.from({ length: 10 }, (_, index) => (
                <Icon key={index} name="globe" className="size-4" />
              ))}
            </div>
            <Button className="mt-6" onClick={() => setShowUpsellDialog(true)}>
              <Icon name="unlock" className="size-4" />
              {t('expand_search.unlock_platforms')}
            </Button>
          </div>
        )}
      </Card>
      <UpsellDialog
        open={showUpsellDialog}
        onOpenChange={setShowUpsellDialog}
        onSuccessClose={() => setJustUnlocked(true)}
        productKey="social_networks"
        translationNamespace="pages.reverse_lookup.report.upsell.social_networks"
        benefitKeys={['scan_10_major_social_platforms', 'related_usernames_and_public_profile', 'matching_accounts']}
        reportId={reportId}
      />
    </>
  );
};

export default PossibleSocialMediaAccounts;
