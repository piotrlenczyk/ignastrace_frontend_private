import { DialogDescription, DialogPortal, DialogTitle } from '@radix-ui/react-dialog';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { UpsellPurchaseSurface } from '@/components/upsell/upsell-purchase-surface';
import { useUpsellUnlock } from '@/hooks/api/use-upsell-unlock';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { recordFunnelUpsell } from '@/libs/funnel-upsell-record';
import { useSettings } from '@/settings/settings.provider';

import type { SuccessUpsellKey, UpsellOffer } from '../_types/upsell-offer';

/**
 * What differs between the two extras: the icon, and which translation key holds
 * the long copy behind the details button.
 *
 * One map rather than a branch per rendered thing, so adding an extra is an entry
 * here instead of another `key === 'scan_pro'` scattered through the markup.
 * `support_hotline` has no `dialog` key of its own and reuses its description,
 * which is what the screen did before.
 */
const CARD_CONTENT: Record<
  SuccessUpsellKey,
  { icon: 'scan' | 'customer-support'; dialogKey: 'products.scan_pro.dialog' | 'products.support_hotline.description' }
> = {
  scan_pro: { icon: 'scan', dialogKey: 'products.scan_pro.dialog' },
  support_hotline: { icon: 'customer-support', dialogKey: 'products.support_hotline.description' },
};

/**
 * The two extras, each buying itself.
 *
 * There is no cart. The payments service buys one price at a time, and a single
 * button firing two calls in sequence leaves a member charged for the first when
 * the second is declined — so each card carries its own button, its own failure
 * and its own bought state. ADR 0032 records the trade, and the condition under
 * which the single button could come back.
 */
export const ProductCards = ({ offers }: { offers: UpsellOffer[] }) => (
  <div className="container-content">
    <div className="mx-auto my-0 flex w-full max-w-full overflow-x-auto pb-6">
      {offers.map((offer) => (
        <div
          className={`
            box-content flex max-w-[50%] min-w-[280px] flex-1 px-3
            first:pl-5
            last:pr-5
            md:first:pl-0
            md:last:pr-0
          `}
          key={offer.key}
        >
          <ProductCard offer={offer} />
        </div>
      ))}
    </div>
  </div>
);

/**
 * One card, wrapped in its own purchase surface keyed on its own price row's
 * provider account — the funnel card's shape, for the same reason: a 3-D Secure
 * challenge is presented for the card that was pressed.
 */
const ProductCard = ({ offer }: { offer: UpsellOffer }) => (
  <UpsellPurchaseSurface price={offer.product.price}>
    <ProductCardOffer offer={offer} />
  </UpsellPurchaseSurface>
);

/** Inside the surface, where the confirmation is reachable. Split out for that alone. */
const ProductCardOffer = ({ offer: { key, product } }: { offer: UpsellOffer }) => {
  const t = useTranslations('pages.upsell');
  const tNew = useTranslations('__NEW__.success_upsell');
  const tStripeForm = useTranslations('components.forms.stripe_form');
  const formatPrice = createPriceFormatter();
  const locale = useLocale();
  const { countryCode: country } = useSettings();
  const { purchase } = useUpsellUnlock();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  /*
   * The card remembers its own purchase, and deliberately does not re-read the
   * payments count: every legacy key resolves to one placeholder product on the
   * development instance, so a re-read after buying this card would report the
   * other one as bought too.
   */
  const [isBought, setIsBought] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const amount = formatPrice(product.price.amount, product.price.currency, country, locale);

  const handleBuy = async () => {
    setIsPurchasing(true);
    setHasFailed(false);

    /* The price identifier off the row whose amount is displayed above. */
    const result = await purchase(product.price.id);

    setIsPurchasing(false);

    if (result.outcome !== 'purchased') {
      setHasFailed(true);
      return;
    }

    /*
     * The funnel's record of what this run bought, written only where the charge
     * actually went through. The thank-you screen after this one prices it; before
     * this existed it reported one invented amount to everybody who reached it,
     * whether or not they had bought either extra.
     */
    recordFunnelUpsell(key);

    setIsBought(true);
  };

  const boughtState = (iconClassName: string) => (
    <div
      className={`
        flex items-center gap-1 rounded-lg border border-green-800 bg-white px-3 py-2 text-sm font-bold text-green
      `}
    >
      <Icon name="tick" className={iconClassName} />
      {tNew('bought_state')}
    </div>
  );

  const buyButton = (
    <Button onClick={handleBuy} disabled={isPurchasing}>
      {tNew('buy_button')}
      {isPurchasing ? <Icon name="reload" className="animate-spin" /> : null}
    </Button>
  );

  const { icon: iconName, dialogKey } = CARD_CONTENT[key];
  const icon = <Icon name={iconName} />;

  /*
   * A decline is reported on the card that was pressed and nowhere else, so one
   * extra failing does not read as the screen failing. The other card stays for
   * sale. The copy is the one the application already reports a failed charge
   * with.
   */
  const failureMessage = hasFailed ? (
    <p role="alert" className="text-caption text-error">
      {tStripeForm('errors.stripe_generic_error')}
    </p>
  ) : null;

  return (
    <div className="flex flex-1 flex-col gap-4 rounded-2xl bg-base p-6 text-strong shadow-raised">
      <div className="brand-icon">{icon}</div>
      <div>
        <h2 className="mb-1 text-lg/normal font-bold">{t(`products.${key}.title`)}</h2>
        <p className="text-sm">{t(`products.${key}.description`)}</p>
      </div>
      <div className="mt-auto font-semibold">{amount}</div>
      <div className="flex min-h-10 items-center justify-between gap-4">
        {isBought ? boughtState('text-base') : buyButton}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="tertiary">
              {t('products.details_button')}
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogContent className="dialog-products">
              <DialogHeader className="mb-6">
                <div className="brand-icon mb-4">{icon}</div>
                <DialogTitle className="h3 font-bold">{t(`products.${key}.title`)}</DialogTitle>
              </DialogHeader>

              <DialogDescription asChild>
                <div dangerouslySetInnerHTML={{ __html: t.raw(dialogKey) }} />
              </DialogDescription>

              <DialogFooter className="mt-4 min-h-10 items-center justify-between">
                {isBought ? boughtState('text-xl') : buyButton}

                <div className="font-semibold">{amount}</div>
              </DialogFooter>
              {failureMessage}
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
      {/* Once, wherever the member is looking: the dialog covers the card. */}
      {!isDialogOpen && failureMessage}
    </div>
  );
};
