'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Card } from '@/components/homepage/card';
import LimitedOfferTag from '@/components/reverse-lookup/limited-offer-tag';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { UpsellPurchaseSurface } from '@/components/upsell/upsell-purchase-surface';
import { useOwnsUpsell } from '@/hooks/api/use-owns-upsell';
import { useUpsellUnlock } from '@/hooks/api/use-upsell-unlock';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { useMessageErrorToast } from '@/hooks/use-message-error-toast';
import { recordFunnelUpsell } from '@/libs/funnel-upsell-record';
import type { UpsellProduct, UpsellProductKey } from '@/libs/upsell-products';
import { useSettings } from '@/settings/settings.provider';

type UpsellCardProps = {
  title: string;
  specialOfferText: string;
  upsellBenefits: {
    title: string;
    icon: React.ReactNode;
  }[];
  redirectUrl: string;
  iconUrl: string;
  purchaseButtonText: string;
  /*
   * The payments row, as the payments service returned it, and the legacy key
   * beside it rather than folded into it. Since ADR 0030 the card renders the
   * amount off that row and charges the same row — the divergence ADR 0029
   * recorded is closed — while the key is what names the upsell to the ownership
   * read and to the translations.
   */
  product: UpsellProduct;
  productKey: UpsellProductKey;
};

/**
 * One funnel step's offer, bought on the payments service.
 *
 * A step buys and stops there: at this moment no report exists to spend a credit
 * against, so the credit waits on the member's balance and is spent later from the
 * member area. ADR 0030 records why that is the whole of a step's job.
 */
const UpsellCard = (props: UpsellCardProps) => (
  <UpsellPurchaseSurface price={props.product.price}>
    <UpsellCardOffer {...props} />
  </UpsellPurchaseSurface>
);

/**
 * Inside the purchase surface, where the 3-D Secure confirmation is reachable.
 * Split out for that reason alone.
 */
const UpsellCardOffer = ({
  title,
  specialOfferText,
  upsellBenefits,
  redirectUrl,
  iconUrl,
  purchaseButtonText,
  product,
  productKey,
}: UpsellCardProps) => {
  const t = useTranslations('pages.reverse_lookup.upsell');
  const tStripeForm = useTranslations('components.forms.stripe_form');

  /*
   * Whether this visitor already has the thing on offer, read from whichever
   * upstream knows: the new API's credit balances for a credit-balance product,
   * the entitlement on the current user for unlimited PDF downloads. What it
   * replaces is the composed member's list of extras, which was a fixture for
   * every key but one — so a step deciding whether to sell was asking an invented
   * question. ADR 0030 records the change.
   */
  const { ownsUpsell, isLoading: isLoadingOwnership } = useOwnsUpsell(productKey);
  const { purchase } = useUpsellUnlock();

  const router = useRouter();
  const locale = useLocale();
  const { countryCode: country } = useSettings();
  const formatPrice = createPriceFormatter();
  const showErrorToast = useMessageErrorToast();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);

  /*
   * Said before the button is pressed rather than after it. The old gate could
   * only answer on the click — it fetched the member imperatively out of the
   * handler — so a visitor who already owned the extra was shown the full offer
   * and only told on pressing Buy. The ownership read is at render now, so a step
   * with nothing to sell says so.
   */
  const getButtonContent = () => {
    if (ownsUpsell) {
      return t('already_purchased');
    }
    if (isSubmitted) {
      return (
        <span className="flex items-center gap-1">
          {t('processing')}
          <Icon name="reload" className="size-4 animate-spin" />
        </span>
      );
    }
    return purchaseButtonText;
  };

  const handlePurchaseUpsell = async () => {
    setIsSubmitted(true);

    /* The price identifier off the row whose amount is on the button above. */
    const result = await purchase(product.price.id);

    if (result.outcome !== 'purchased') {
      setIsSubmitted(false);
      showErrorToast(tStripeForm('errors.stripe_generic_error'), tStripeForm('errors.stripe_generic_error_title'));
      return;
    }

    /*
     * The funnel's record of what this run bought, written only where the charge
     * actually went through. The confirmation screen at the end of the run reads
     * it and prices it; before this existed it reported an invented amount to
     * everybody who reached it, whether or not they had bought anything.
     */
    recordFunnelUpsell(productKey);

    router.push(redirectUrl);
  };

  const handleSkip = () => {
    setIsSkipped(true);
    router.push(redirectUrl);
  };

  return (
    <Card className="border border-stroke-weak px-4 py-6 shadow-raised lg:p-8">
      <div className="flex flex-col gap-5">
        <div className="flex justify-between">
          <h3 className="max-w-[180px] h3 font-bold lg:max-w-[345px]">{title}</h3>
          <Image src={iconUrl} alt={`${title} icon`} width={63} height={72} />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold lg:text-2xl">{t('total_due_today')}</h4>
              <div className="flex flex-col">
                <span className="h4 text-right font-bold">
                  {formatPrice(product.price.amount, product.price.currency, country, locale)}
                </span>
              </div>
            </div>
            <LimitedOfferTag className="mx-auto" />
          </div>
          <Button
            className="font-semibold lg:hidden"
            onClick={handlePurchaseUpsell}
            disabled={ownsUpsell || isSubmitted || isLoadingOwnership}
          >
            {getButtonContent()}
          </Button>
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
              <Icon name="discount" className="size-6" />
              <span className="lg:text-base">{specialOfferText}</span>
            </div>
            {upsellBenefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-[6px]">
                {benefit.icon}
                <span className="text-lg">{benefit.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className={`
              flex-1 border border-stroke-weak font-semibold text-weak
              hover:text-weak
              lg:max-w-[120px] lg:shrink-0 lg:text-lg
            `}
            onClick={handleSkip}
            disabled={isSubmitted || isSkipped}
          >
            {t('skip')}
          </Button>
          <Button
            className="hidden font-semibold lg:flex lg:flex-1 lg:text-lg"
            onClick={handlePurchaseUpsell}
            disabled={ownsUpsell || isSubmitted || isSkipped || isLoadingOwnership}
          >
            {getButtonContent()}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default UpsellCard;
