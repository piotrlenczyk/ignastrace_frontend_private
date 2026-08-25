'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useRouter } from '@/libs/i18n-routing';

import type { UpsellOffer } from '../_types/upsell-offer';
import { ProductCards } from './product-cards';

/**
 * The order-success offer, with each extra bought on its own card.
 *
 * What used to be here as well was a cart: an order-details summary with a
 * running total, add and remove actions, and one bottom button that wrote both
 * keys to the legacy upselling endpoint in a single call. The payments service
 * has no operation that buys two products at once, so that button is gone and
 * the cards carry the purchase. What remains beside them is the way off the
 * screen to the thank-you screen — saying no is still one action.
 */
const UpsellPageClient = ({ offers }: { offers: UpsellOffer[] }) => {
  const t = useTranslations('pages.upsell');
  const router = useRouter();

  return (
    <>
      <div className="s-main bg-alternate py-6">
        <div className="container-content px-6 md:px-0">
          <h1 className="mb-3 h3 font-bold">{t('title')}</h1>
          <p className="mb-6 text-strong">{t('description')}</p>
        </div>
        <ProductCards offers={offers} />
      </div>
      <div className="sticky bottom-0 bg-base-blur p-6 backdrop-blur-xl md:px-0">
        <div className="container-content flex flex-col gap-4">
          <Button
            variant="ghost"
            className="mx-auto text-base font-normal text-weak underline underline-offset-2"
            onClick={() => router.push(ROUTES.THANK_YOU)}
          >
            {t('cancel_button')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default UpsellPageClient;
