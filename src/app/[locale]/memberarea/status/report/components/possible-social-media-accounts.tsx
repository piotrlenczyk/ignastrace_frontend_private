'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  IconAlertTriangleLine,
  IconLockOpenLine,
  IconOpenEternalLink,
  IconSocialBehance,
  IconSocialFacebook,
  IconSocialGithub,
  IconSocialGitlab,
  IconSocialInstagram,
  IconSocialKick,
  IconSocialPinterest,
  IconSocialReddit,
  IconSocialSnapchat,
  IconSocialTelegram,
  IconSocialThreads,
  IconSocialTiktok,
  IconSocialTumblr,
  IconSocialTwitch,
  IconSocialX,
  IconSocialYoutube,
} from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';
import type { ReverseLookup, SocialMediaKind } from '@/types/reverse-lookup.types';

import { useReverseLookupQuery } from '../_hooks/api/use-reverse-lookup-query';
import { AlertInfo } from './alert-info';
import UpsellDialog from './upsell-dialog';

const POLL_INTERVAL_MS = 3000;

const getSocialIcon = (kind: SocialMediaKind) => {
  switch (kind) {
    case 'behance':
      return <IconSocialBehance className="size-6" />;
    case 'github':
      return <IconSocialGithub className="size-6" />;
    case 'gitlab':
      return <IconSocialGitlab className="size-6" />;
    case 'instagram':
      return <IconSocialInstagram className="size-6" />;
    case 'facebook':
      return <IconSocialFacebook className="size-6 text-[#0966FF]" />;
    case 'pinterest':
      return <IconSocialPinterest className="size-6" />;
    case 'x':
      return <IconSocialX className="size-6" />;
    case 'kick':
      return <IconSocialKick className="size-6" />;
    case 'reddit':
      return <IconSocialReddit className="size-6" />;
    case 'snapchat':
      return <IconSocialSnapchat className="size-6" />;
    case 'telegram':
      return <IconSocialTelegram className="size-6" />;
    case 'threads':
      return <IconSocialThreads className="size-6" />;
    case 'tiktok':
      return <IconSocialTiktok className="size-6" />;
    case 'tumblr':
      return <IconSocialTumblr className="size-6" />;
    case 'twitch':
      return <IconSocialTwitch className="size-6" />;
    case 'youtube':
      return <IconSocialYoutube className="size-6" />;
    default:
      return null;
  }
};

const PossibleSocialMediaAccounts = ({
  className,
  reverseLookup,
}: { className?: string; reverseLookup: ReverseLookup }) => {
  const [showUpsellDialog, setShowUpsellDialog] = useState(false);
  const [showLookingForMore, setShowLookingForMore] = useState(
    () => {
      const hasProcessingSocialNetworks = reverseLookup.reverse_lookup_social_media_accounts.some(({ progress_status }) => progress_status === 'processing');

      return reverseLookup.reverse_lookup_social_networks_upsell_purchased && hasProcessingSocialNetworks;
    },
  );

  const router = useRouter();

  const { data } = useReverseLookupQuery(reverseLookup.id, {
    refetchInterval: showLookingForMore ? POLL_INTERVAL_MS : false,
  });

  useEffect(() => {
    if (data) {
      const hasProcessingSocialNetworks = data.reverse_lookup_social_media_accounts.some(({ progress_status }) => progress_status === 'processing');

      if (!hasProcessingSocialNetworks) {
        setShowLookingForMore(false);
      }
    }
  }, [data, router]);

  const t = useTranslations('pages.reverse_lookup.report.possible_social_media_accounts');

  const socialNetworks = data?.reverse_lookup_social_media_accounts || reverseLookup.reverse_lookup_social_media_accounts;
  const isEmpty = socialNetworks.length === 0;

  return (
    <>
      <Card className={cn('flex flex-col gap-6 border-stroke-weak px-4 py-6 shadow-raised lg:px-6', className)}>
        <h4 className="font-bold">
          {isEmpty ? t('title_empty') : t('title')}
        </h4>

        <AlertInfo>
          {t('info')}
        </AlertInfo>

        {isEmpty
        && (
          <AlertInfo
            className="border-amber-200 border-l-warning-stroke-strong bg-warning-fill"
            iconClassName="text-warning-stroke-strong"
          >
            {t('no_accounts_found')}
          </AlertInfo>
        )}
        {!isEmpty && (
          <>
            {socialNetworks.map(item => (
              <div
                key={item.kind}
                className={`
                  flex flex-col items-start gap-3 rounded-2xl border border-overlay-light p-4 sm:flex-row
                  sm:items-center
                `}
              >
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full border">
                    {getSocialIcon(item.kind)}
                  </div>
                  <div className="flex-1">
                    <div className="leading-[24px]">
                      <p>
                        <span className="mr-1">
                          {t('labels.source')}
                          :
                        </span>
                        <span className="text-lg font-bold">
                          {t(`sources.${item.kind}`)}
                        </span>
                      </p>
                      <p>
                        <span className="mr-1">
                          {t('labels.name')}
                          :
                        </span>
                        <span className="text-lg font-bold">
                          {item.username}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                {item.progress_status === 'done' && (
                  <>
                    {item.url
                    && (
                      <Button variant="secondary" asChild>
                        <a href={item.url} target="_blank" rel="noindex nofollow noopener noreferrer">
                          {t('labels.opne_url')}
                          <IconOpenEternalLink className="size-4" />
                        </a>
                      </Button>
                    )}
                    {!item.url
                    && (
                      <span
                        className={`
                          flex h-[32px] items-center gap-1 rounded-2xl border border-warning-stroke px-2 text-amber
                        `}
                      >
                        <IconAlertTriangleLine className="text-amber-800" size="mediumLarge" />
                        {t('network_not_found')}
                      </span>
                    )}
                  </>
                )}
                {item.progress_status !== 'done' && (
                  <div
                    className={`
                      size-6 animate-spin rounded-full border-[3px] border-neutral border-t-transparent duration-1000
                    `}
                  />
                )}
              </div>
            ))}
            {!reverseLookup.reverse_lookup_social_networks_upsell_purchased
            && (
              <div className="flex flex-col items-center rounded-2xl border border-primary-200 bg-primary-50 px-4 py-8">
                <h4 className="font-bold">{t('expand_search.title')}</h4>
                <p className="mt-2 text-sm text-weak">{t('expand_search.more_platforms')}</p>
                <div className="mt-5 flex gap-2">
                  <IconSocialBehance className="size-4" />
                  <IconSocialGithub className="size-4" />
                  <IconSocialGitlab className="size-4" />
                  <IconSocialKick className="size-4" />
                  <IconSocialSnapchat className="size-4" />
                  <IconSocialThreads className="size-4" />
                  <IconSocialTiktok className="size-4" />
                  <IconSocialTumblr className="size-4" />
                  <IconSocialTwitch className="size-4" />
                  <IconSocialX className="size-4" />
                </div>
                <Button
                  className="mt-6"
                  onClick={() => setShowUpsellDialog(true)}
                >
                  <IconLockOpenLine className="size-4" />
                  {t('expand_search.unlock_platforms')}
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
      <UpsellDialog
        open={showUpsellDialog}
        onOpenChange={setShowUpsellDialog}
        onSuccessClose={() => setShowLookingForMore(true)}
        productKey="social_networks"
        translationNamespace="pages.reverse_lookup.report.upsell.social_networks"
        benefitKeys={[
          'scan_10_major_social_platforms',
          'related_usernames_and_public_profile',
          'matching_accounts',
        ]}
        purchaseParams={{ reverseLookupId: reverseLookup.id }}
      />
    </>
  );
};

export default PossibleSocialMediaAccounts;
