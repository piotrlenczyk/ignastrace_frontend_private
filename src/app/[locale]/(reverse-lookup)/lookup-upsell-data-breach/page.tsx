import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/auth';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { IconCheckCircle } from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { getApi } from '@/libs/server/api';

import type { Product } from '../../success/_types/product.type';
import UpsellCard from '../_components/upsell-card';
import UpsellProgressSteps from '../_components/upsell-progress-steps';

const UpsellDataBreachPage = async () => {
  const t = await getTranslations('pages.reverse_lookup.upsell.data_breach');
  const session = await auth();
  const isAuthenticated = !!session;

  if (!isAuthenticated) {
    redirect(ROUTES.REVERSE_LOOKUP.SIGN_UP);
  }

  const upsellBenefits = [
    {
      title: t('upsell_benefits_1'),
      icon: <IconCheckCircle className="size-6 text-secondary" />,
    },
    {
      title: t('upsell_benefits_2'),
      icon: <IconCheckCircle className="size-6 text-secondary" />,
    },
    {
      title: t('upsell_benefits_3'),
      icon: <IconCheckCircle className="size-6 text-secondary" />,
    },
  ];

  const api = await getApi();
  const products = await api.get<Product[]>('/reverse_lookups_upsellings');
  const upsellProduct = products.find(product => product.key === 'data_leaks') || {
    key: 'data_leaks',
    price: 195,
    currency: 'USD',
  };

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
              redirectUrl={ROUTES.REVERSE_LOOKUP.UPSELLS.SEX_OFFENDERS}
              iconUrl="/images/reverse-lookup/icon-data-breach.svg"
              product={upsellProduct}
            />
            <div className="text-center text-caption text-weak">
              {t('disclaimer')}
            </div>
          </div>
        </section>
      </main>
    </FunnelLayout>
  );
};

export default UpsellDataBreachPage;
