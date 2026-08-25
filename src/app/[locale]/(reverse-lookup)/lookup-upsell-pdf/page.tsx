import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import FunnelLayout from '@/components/layouts/funnel-layout';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { getUpsellProduct } from '@/server/getters/upsell-products.getters';
import { getServerSession } from '@/server/session/session.utils';
import { getServerSettings } from '@/settings/settings.server';

import UpsellCard from '../_components/upsell-card';
import UpsellProgressSteps from '../_components/upsell-progress-steps';

const UpsellPdfPage = async () => {
  const t = await getTranslations('pages.reverse_lookup.upsell.pdf');
  const session = await getServerSession();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.REVERSE_LOOKUP.SIGN_UP);
  }

  const upsellBenefits = [
    {
      title: t('upsell_benefits_1'),
      icon: <Icon name="check-circle" className="size-6 text-secondary" />,
    },
    {
      title: t('upsell_benefits_2'),
      icon: <Icon name="check-circle" className="size-6 text-secondary" />,
    },
    {
      title: t('upsell_benefits_3'),
      icon: <Icon name="check-circle" className="size-6 text-secondary" />,
    },
    {
      title: t('upsell_benefits_4'),
      icon: <Icon name="check-circle" className="size-6 text-secondary" />,
    },
  ];

  const locale = await getLocale();
  const country = (await getServerSettings()).countryCode;
  const formatPrice = await createPriceFormatter();
  /*
   * The step after this one, named once: the visitor reaches it either by
   * skipping the offer, by buying it, or — below — because there is no offer to
   * make.
   */
  const nextStep = ROUTES.REVERSE_LOOKUP.UPSELLS.DATA_BREACH;
  const upsellProduct = await getUpsellProduct('unlimited_pdf_downloads');

  /*
   * No product, no offer. A payments catalogue with no row for this upsell, a row
   * with no price, and a refused or unreachable payments service all arrive here
   * as `undefined`, and all mean the same thing: this step has no amount any
   * upstream stands behind, so it takes the visitor to the next one instead of
   * showing a number nobody quoted. What this replaced was a hardcoded $1.95.
   * ADR 0029 records the trade.
   */
  if (!upsellProduct) {
    redirect(nextStep);
  }

  const price = formatPrice(upsellProduct.price.amount, upsellProduct.price.currency, country, locale);

  return (
    <FunnelLayout isReverseLookup showLogoLink={false}>
      <main className="s-main overflow-hidden px-4 pb-10 md:pb-20 lg:px-0">
        <UpsellProgressSteps currentStep={2} />
        <section className="container-wide">
          <div className="mx-auto flex max-w-[560px] flex-col items-center gap-8">
            <UpsellCard
              title={t('title')}
              specialOfferText={t('special_limited_time_offer')}
              purchaseButtonText={t('purchase')}
              upsellBenefits={upsellBenefits}
              redirectUrl={nextStep}
              iconUrl="/images/reverse-lookup/icon-pdf.svg"
              product={upsellProduct}
              productKey="unlimited_pdf_downloads"
            />
            <div className="text-center text-caption text-weak">{t('disclaimer', { price })}</div>
          </div>
        </section>
      </main>
    </FunnelLayout>
  );
};

export default UpsellPdfPage;
