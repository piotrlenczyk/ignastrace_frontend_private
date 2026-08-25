import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import FunnelLayout from '@/components/layouts/funnel-layout';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { getUpsellProduct } from '@/server/getters/upsell-products.getters';
import { getServerSession } from '@/server/session/session.utils';

import UpsellCard from '../_components/upsell-card';
import UpsellProgressSteps from '../_components/upsell-progress-steps';

const UpsellDataBreachPage = async () => {
  const t = await getTranslations('pages.reverse_lookup.upsell.data_breach');
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
  ];

  /*
   * The step after this one, named once: the visitor reaches it either by
   * skipping the offer, by buying it, or — below — because there is no offer to
   * make.
   */
  const nextStep = ROUTES.REVERSE_LOOKUP.UPSELLS.SEX_OFFENDERS;
  const upsellProduct = await getUpsellProduct('data_leaks');

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

  return (
    <FunnelLayout isReverseLookup showLogoLink={false}>
      <main className="s-main overflow-hidden px-4 pb-10 md:pb-20 lg:px-6">
        <UpsellProgressSteps currentStep={3} />
        <section className="container-wide">
          <div className="mx-auto flex max-w-[560px] flex-col items-center gap-8">
            <UpsellCard
              title={t('title')}
              specialOfferText={t('special_limited_time_offer')}
              purchaseButtonText={t('purchase')}
              upsellBenefits={upsellBenefits}
              redirectUrl={nextStep}
              iconUrl="/images/reverse-lookup/icon-data-breach.svg"
              product={upsellProduct}
              productKey="data_leaks"
            />
            <div className="text-center text-caption text-weak">{t('disclaimer')}</div>
          </div>
        </section>
      </main>
    </FunnelLayout>
  );
};

export default UpsellDataBreachPage;
