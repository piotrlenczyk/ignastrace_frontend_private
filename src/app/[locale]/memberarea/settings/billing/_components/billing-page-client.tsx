'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { useToast } from '@/hooks/use-toast';
import { Link, useRouter } from '@/libs/i18n-routing';
import { useReactivateSubscriptionMutation } from '@/network/payments-api/hooks/use-reactivate-subscription-mutation';
import type { CalculatedSubscriptionStatus, ProductWithPrice, SubscriptionDetails } from '@/types/pricing.types';

import { localeFormatDate } from '../../../status/_page/utils';
import { LogoutButton } from '../../_components/logout-button';
import { ActivateSubscription } from './activate-subscription';
import { CancelSubscription } from './cancel-subscription';

export type BillingPageClientProps = {
  subscription: SubscriptionDetails;
  country: string;
  /** The reactivation price, present exactly when the server read one to offer. */
  activationProduct?: ProductWithPrice;
};

/**
 * A badge names its label's namespace as well as its key, because the two are
 * typed separately: the states legacy already had keep the screen's existing
 * copy, and the three the payments vocabulary adds are new copy, which lands
 * under `__NEW__`. `isNewCopy` is the discriminant that picks the translator.
 */
type StatusBadge = { className: string; icon: IconName } & (
  | { isNewCopy?: never; labelKey: 'active_state' | 'canceled_state' | 'expired_state' }
  | { isNewCopy: true; labelKey: 'initial_state' | 'incomplete_state' | 'pending_state' }
);

/**
 * Every state the payments service can report, badged.
 *
 * The screen used to know three of them and render nothing at all for the rest.
 * It now covers the whole vocabulary, including `pending` — the state the reader
 * computes for a subscription the service is still retrying payment on, which
 * legacy had no name for and this screen therefore used to call "expired".
 */
const STATUS_BADGES: Record<CalculatedSubscriptionStatus, StatusBadge> = {
  active: { className: 'badge-active', icon: 'check-circle', labelKey: 'active_state' },
  cancelled: { className: 'badge-canceled', icon: 'cancel', labelKey: 'canceled_state' },
  expired: { className: 'badge-expired', icon: 'cancel', labelKey: 'expired_state' },
  pending: { className: 'badge-pending', icon: 'hourglass', labelKey: 'pending_state', isNewCopy: true },
  initial: { className: 'badge-pending', icon: 'hourglass', labelKey: 'initial_state', isNewCopy: true },
  incomplete: { className: 'badge-pending', icon: 'hourglass', labelKey: 'incomplete_state', isNewCopy: true },
};

export function BillingPageClient({ subscription, country, activationProduct }: BillingPageClientProps) {
  const locale = useLocale();
  const t = useTranslations('pages.settings.billing');
  const tNew = useTranslations('__NEW__.settings.billing');
  const formatCldrPrice = createPriceFormatter();
  const router = useRouter();
  const { toast } = useToast();

  const { price } = subscription.product;
  const badge = STATUS_BADGES[subscription.calculatedStatus];
  const formattedPrice = formatCldrPrice(price.amount, price.currency, country, locale);

  /*
   * Calling off a cancellation, on the same upstream the screen reads. The
   * operation takes nothing — which subscription it resumes comes from the cookie
   * the proxy attaches — and answers an acknowledgement rather than a
   * subscription, so refreshing is what shows the member the result: the read is a
   * server render, and there is no client-held copy of the subscription.
   *
   * The cancellation is not here. It lives in the dialog that confirms it, which
   * is the only thing that knows when to close.
   */
  const { mutate: reactivateSubscription, isPending: isReactivating } = useReactivateSubscriptionMutation();

  const handleReactivate = () =>
    reactivateSubscription(
      {},
      {
        onSuccess: () => {
          router.refresh();
        },
        onError: (error) => {
          console.error('The payments service refused to call off the cancellation', error);
          toast({ title: tNew('reactivate_error'), variant: 'destructive' });
        },
      },
    );

  return (
    <>
      <div className="mb-4 rounded-lg border border-stroke-weak p-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="h4 font-bold">{t('subscription')}</h2>
          <span className={`${badge.className} px-2 py-px`}>
            <Icon name={badge.icon} className="size-4" />
            {badge.isNewCopy ? tNew(badge.labelKey) : t(badge.labelKey)}
          </span>
        </div>
        <div>
          <div className="flex justify-between gap-2 border-b border-border py-2">
            <span>Mobitrace</span>
            <span className="font-bold">
              {formattedPrice}/{t('month')}
            </span>
          </div>
          <div className="mb-5 flex justify-between gap-2 py-4">
            <span>{t('total')}</span>
            <span className="font-bold">
              {formattedPrice}/{t('month')}
            </span>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <p>{t('started_on_date', { date: localeFormatDate(subscription.createdAt, locale) })}</p>
            {subscription.calculatedStatus === 'active' && (
              <p>{t('next_billing_date', { date: localeFormatDate(subscription.expiresAt, locale) })}</p>
            )}
            {/*
             * The payments service is retrying the card. The member still has
             * access, so the screen states when the next attempt falls rather
             * than offering them a price they do not need to pay.
             */}
            {subscription.calculatedStatus === 'pending' && subscription.nextPaymentAttemptAt && (
              <p>
                {tNew('next_payment_attempt_date', {
                  date: localeFormatDate(subscription.nextPaymentAttemptAt, locale),
                })}
              </p>
            )}
            {subscription.calculatedStatus === 'expired' && (
              <>
                <p className="text-destructive">
                  {t('expired_date', { date: localeFormatDate(subscription.expiresAt, locale) })}
                </p>
                <p className="text-destructive">{t('expired_description')}</p>
                {activationProduct && (
                  <ActivateSubscription buttonText={t('expired_cta')} country={country} product={activationProduct} />
                )}
              </>
            )}
            {subscription.calculatedStatus === 'cancelled' && (
              <>
                {/* Optional on the payments response, so the row states the date only when there is one. */}
                {subscription.cancelledAt && (
                  <p>{t('canceled_date', { date: localeFormatDate(subscription.cancelledAt, locale) })}</p>
                )}
                <p>{t('active_date', { date: localeFormatDate(subscription.expiresAt, locale) })}</p>
              </>
            )}
            {subscription.couldReactivate && (
              <Button className="mt-4" onClick={handleReactivate} disabled={isReactivating}>
                {t('canceled_cta')}
              </Button>
            )}
            {subscription.couldCancel && (
              <div className="mt-2">
                <CancelSubscription />
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
