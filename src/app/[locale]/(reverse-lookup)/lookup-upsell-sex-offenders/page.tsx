import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';

import FunnelLayout from '@/components/layouts/funnel-layout';
import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { createPriceFormatter } from '@/hooks/cldr-price-formatter';
import { getApi } from '@/libs/server/api';
import { getUserCountry } from '@/libs/server/user-country';
import { getServerSession } from '@/server/session/session.utils';

import type { Product } from '../../success/_types/product.type';
import UpsellCard from '../_components/upsell-card';
import UpsellProgressSteps from '../_components/upsell-progress-steps';

const UpsellSexOffendersPage = async () => {
  const t = await getTranslations('pages.reverse_lookup.upsell.sex_offenders');
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

  const locale = await getLocale();
  const country = await getUserCountry();
  const formatPrice = await createPriceFormatter();
  const api = await getApi();
  const products = await api.get<Product[]>('/reverse_lookups_upsellings');

  const upsellProduct = products.find((product) => product.key === 'sex_offenders') || {
    key: 'sex_offenders',
    price: 195,
    currency: 'USD',
  };

  const price = formatPrice(upsellProduct.price, upsellProduct.currency, country, locale);

  return (
    <FunnelLayout isReverseLookup showLogoLink={false}>
      <main className="s-main overflow-hidden px-4 pb-10 md:pb-20 lg:px-6">
        <UpsellProgressSteps currentStep={4} />
        <section className="container-wide">
          <div className="mx-auto flex max-w-[560px] flex-col items-center gap-8">
            <UpsellCard
              title={t('title')}
              specialOfferText={t('special_limited_time_offer')}
              purchaseButtonText={t('purchase')}
              upsellBenefits={upsellBenefits}
              redirectUrl={ROUTES.REVERSE_LOOKUP.THANK_YOU}
              iconUrl="/images/reverse-lookup/icon-sex-offenders.svg"
              product={upsellProduct}
            />
            <p className="text-center text-caption text-weak">{t('disclaimer')}</p>
            <p className="text-center text-caption text-weak">{t('purchase_terms', { price })}</p>
          </div>
        </section>
      </main>
    </FunnelLayout>
  );
};

export default UpsellSexOffendersPage;
