import { redirect } from 'next/navigation';

import { getFunnelPhone } from '@/actions/funnel-phone-number';
import FunnelLayout from '@/components/layouts/funnel-layout';
import { ROUTES } from '@/constants/routes';
import { getCurrencyProducts, getPlanProductName, getPricingProduct } from '@/libs/pricing';
import { getCheckoutPricing } from '@/server/getters/pricing.getters';
import { getServerSettings } from '@/settings/settings.server';

import AsSeenOn from '../_components/as-seen-on';
import { CustomerOpinionsSection } from '../_components/customer-opinions-section';
import { FAQs } from '../_components/faqs';
import GetReport from '../_components/getReport';
import RecentReveals from '../_components/recent-reveals';
import SummaryReportCard from '../_components/summary-report-card';
import WhatYouGet from '../_components/whatYouGet';

const SummaryPage = async () => {
  const phoneNumber = await getFunnelPhone();

  if (!phoneNumber) {
    return redirect(ROUTES.REVERSE_LOOKUP.HOME);
  }

  const country = (await getServerSettings()).countryCode;
  const { pricing, initialCurrency } = await getCheckoutPricing(country);

  /*
   * The trial product, resolved the way the checkout that follows resolves it:
   * same catalogue read, same currency, same plan. This screen sells the trial and
   * only the trial, and it carries no currency selector, so the amount quoted here
   * is the amount the next screen opens on — one catalogue, one number.
   */
  const { price } = getPricingProduct({
    plan: getPlanProductName('trial'),
    currencyProducts: getCurrencyProducts({ products: pricing.products, currency: initialCurrency }),
  });

  return (
    <FunnelLayout isReverseLookup showLogoLink={false}>
      <main className="s-main overflow-hidden pb-10 md:pb-20 lg:px-6">
        <section className="container-wide">
          <SummaryReportCard phoneNumber={phoneNumber} />
          <div className="mx-4 mt-4 mb-7 grid grid-cols-1 gap-8 md:mt-16 md:mb-5 md:grid-cols-2 md:pt-2 lg:mx-0">
            <GetReport price={price} country={country} />
            <WhatYouGet />
          </div>
          <AsSeenOn className="mx-4 pt-4 pb-6 md:mx-0 md:py-10" />
          <CustomerOpinionsSection />
          <RecentReveals country={country} />
          <hr className="separator m-0 container-wide mx-4 md:mx-0 lg:mx-auto lg:mt-2 lg:block" />
          <FAQs className="container-wide px-4 py-6 lg:px-0 lg:py-20" id="faq">
            <FAQs.Title />
            <FAQs.Content className="rounded-3xl bg-alternate px-5 lg:px-10 lg:py-4" />
          </FAQs>
        </section>
      </main>
    </FunnelLayout>
  );
};

export default SummaryPage;
