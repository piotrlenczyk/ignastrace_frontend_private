'use client';

import { useLocale, useTranslations } from 'next-intl';

import LimitedOfferTag from '@/components/reverse-lookup/limited-offer-tag';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import type { UpsellProduct } from '@/libs/upsell-products';
import { useSettings } from '@/settings/settings.provider';

/*
 * Every caller passes a namespace under `…report.upsell`. Saying so, rather
 * than accepting any namespace at all, is also what keeps this compiling: with
 * next-intl v4's typed messages, `useTranslations` over the full namespace
 * union instantiates one `t` signature per namespace in en.json and TypeScript
 * gives up ("excessively deep").
 */
export type UpsellNamespace = Extract<
  Parameters<typeof useTranslations>[0],
  `pages.reverse_lookup.report.upsell.${string}`
>;

type UpsellOfferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The payments row the amount is read off — and, since ADR 0030, charged. */
  product: UpsellProduct;
  translationNamespace: UpsellNamespace;
  benefitKeys: string[];
  onPurchase: () => void;
  isPending: boolean;
};

/**
 * The offer itself: what it costs, what it buys, and the two buttons.
 *
 * Presentation and nothing else — it takes the amount and the gesture and knows
 * neither which upstream the amount came from nor what pressing the button will
 * do. That is what let the standalone sex-offender search show the member exactly
 * what every migrated upsell did while its purchase was still a legacy call, and
 * what let its bespoke dialog be deleted without a member noticing when ADR 0039
 * moved it.
 */
export const UpsellOfferDialog = ({
  open,
  onOpenChange,
  product,
  translationNamespace,
  benefitKeys,
  onPurchase,
  isPending,
}: UpsellOfferDialogProps) => {
  const t = useTranslations(translationNamespace);
  const formatPrice = createPriceFormatter();
  const locale = useLocale();
  const { countryCode: country } = useSettings();

  const formattedPrice = formatPrice(product.price.amount, product.price.currency, country, locale);

  const upsellBenefits = benefitKeys.map((key) => ({
    icon: <Icon name="check-circle" className="size-6 text-secondary" />,
    title: t(key as Parameters<typeof t>[0]),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-6 md:p-8" hideCloseButton>
        <DialogTitle className="sr-only"></DialogTitle>
        <div className="flex flex-col gap-5">
          <h4 className="h4 font-bold">{t('title')}</h4>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold">{t('total_due_today')}</h4>
                <span className="h4 text-right font-bold">{formattedPrice}</span>
              </div>
              <LimitedOfferTag className="mx-auto" />
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
                <Icon name="discount" className="size-6" />
                <span className="text-sm lg:text-base">{t('special_limited_time_offer')}</span>
              </div>
              {upsellBenefits.map((benefit) => (
                <div key={benefit.title} className="flex gap-[6px]">
                  {benefit.icon}
                  <span className="text-sm lg:text-base">{benefit.title}</span>
                </div>
              ))}
            </div>
            <div className="text-caption whitespace-pre-line text-weak">
              {t('disclaimer_info', { price: formattedPrice })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" onClick={() => onOpenChange(false)} className="text-base font-semibold">
              {t('cancel')}
            </Button>
            <Button className="text-base font-semibold" onClick={onPurchase} disabled={isPending}>
              {isPending ? (
                <>
                  {t('processing_payment')} <Icon name="reload" className="size-4 animate-spin" />
                </>
              ) : (
                t('purchase')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
