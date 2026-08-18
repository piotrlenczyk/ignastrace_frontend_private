'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { Link, useRouter } from '@/libs/i18n-routing';
import type { ProductWithPrice } from '@/types/pricing.types';
import type { Subscription } from '@/types/subscription';

import { localeFormatDate } from '../../../status/_page/utils';
import { LogoutButton } from '../../_components/logout-button';
import { useCancelSubscriptionMutation } from '../_hooks/api/use-cancel-subscription-mutation';
import { useReactivateSubscriptionMutation } from '../_hooks/api/use-reactivate-subscription-mutation';
import { ActivateSubscription } from './activate-subscription';
import { CancelSubscription } from './cancel-subscription';

export type BillingPageClientProps = {
  subscription: Subscription;
  country: string;
  /** The reactivation price, present exactly when the server read one to offer. */
  activationProduct?: ProductWithPrice;
};

export function BillingPageClient({
  subscription: defaultSubscription,
  country,
  activationProduct,
}: BillingPageClientProps) {
  const locale = useLocale();
  const t = useTranslations('pages.settings.billing');
  const [subscription, setSubscription] = useState<Subscription>(defaultSubscription);
  const formatCldrPrice = createPriceFormatter();
  const router = useRouter();
  const expiredSubscriptionCancelAt = subscription.cancel_at || subscription.canceled_at;

  const { mutate: cancelSubscription, isPending: isCanceling } = useCancelSubscriptionMutation({
    onSuccess: (updatedSubscription) => {
      setSubscription(updatedSubscription);
      router.refresh();
    },
    onError: () => {
      console.error('Error canceling subscription');
    },
  });

  const { mutate: reactivateSubscription, isPending: isReactivating } = useReactivateSubscriptionMutation({
    onSuccess: (updatedSubscription) => {
      setSubscription(updatedSubscription);
      router.refresh();
    },
    onError: () => {
      console.error('Error reactivating subscription');
    },
  });

  return (
    <>
      <div className="mb-4 rounded-lg border border-stroke-weak p-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="h4 font-bold">{t('subscription')}</h2>
          {subscription.status === 'active' && (
            <span className="badge-active px-2 py-px">
              <Icon name="check-circle" className="size-4" />
              {t('active_state')}
            </span>
          )}
          {subscription.status === 'cancelled' && (
            <span className="badge-canceled px-2 py-px">
              <Icon name="cancel" className="size-4" />
              {t('canceled_state')}
            </span>
          )}
          {subscription.status === 'expired' && (
            <span className="badge-expired px-2 py-px">
              <Icon name="cancel" className="size-4" />
              {t('expired_state')}
            </span>
          )}
        </div>
        <div>
          <div className="flex justify-between gap-2 border-b border-border py-2">
            <span>Mobitrace</span>
            <span className="font-bold">
              {formatCldrPrice(subscription.price, subscription.currency, country, locale)}/{t('month')}
            </span>
          </div>
          <div className="mb-5 flex justify-between gap-2 py-4">
            <span>{t('total')}</span>
            <span className="font-bold">
              {formatCldrPrice(subscription.price, subscription.currency, country, locale)}/{t('month')}
            </span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p>{t('started_on_date', { date: localeFormatDate(subscription.created, locale) })}</p>
            {subscription.status === 'active' && (
              <p>{t('next_billing_date', { date: localeFormatDate(subscription.current_period_end, locale) })}</p>
            )}
            {subscription.status === 'expired' && expiredSubscriptionCancelAt && (
              <>
                <p className="text-destructive">
                  {t('expired_date', { date: localeFormatDate(expiredSubscriptionCancelAt, locale) })}
                </p>
                <p className="text-destructive">{t('expired_description')}</p>
                {activationProduct && (
                  <ActivateSubscription buttonText={t('expired_cta')} country={country} product={activationProduct} />
                )}
              </>
            )}
            {subscription.status === 'cancelled' && subscription.canceled_at && (
              <>
                <p>{t('canceled_date', { date: localeFormatDate(subscription.canceled_at, locale) })}</p>
                <p>{t('active_date', { date: localeFormatDate(subscription.current_period_end, locale) })}</p>
                <Button className="mt-4" onClick={() => reactivateSubscription()} disabled={isReactivating}>
                  {t('canceled_cta')}
                </Button>
              </>
            )}
            {subscription.status === 'active' && (
              <div className="mt-2">
                <CancelSubscription
                  status={subscription.status}
                  onCancel={cancelSubscription}
                  isPending={isCanceling}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <LogoutButton className="mb-6" />
      <hr className="mb-4 w-full border-t border-border lg:hidden" />
      <div className="flex flex-col justify-center gap-4 text-sm text-weak md:flex-row">
        <Link href={ROUTES.MEMBER.PRIVACY_POLICY} className="link">
          {t('privacy_policy')}
        </Link>

        <Link href={ROUTES.MEMBER.TERMS} className="link">
          {t('terms_and_conditions')}
        </Link>
      </div>
    </>
  );
}
