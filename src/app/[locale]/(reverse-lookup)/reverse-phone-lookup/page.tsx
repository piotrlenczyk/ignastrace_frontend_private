import WebsiteLayout from '@/components/layouts/website-layout';
import { getCurrencyFromCountry } from '@/libs/currency';
import { getApi } from '@/libs/server/api';
import { getUserCountry } from '@/libs/server/user-country';
import type { Products } from '@/types/products';

import { AlwaysKnowWhoCalled } from '../_components/alwaysKnowWhoCalled';
import { CustomerCarousel } from '../_components/customerCarousel';
import { FAQs } from '../_components/faqs';
import { Hero } from '../_components/hero';
import { InstantLocator } from '../_components/instantLocator';
import { LatestResults } from '../_components/latestResults';
import { Locator } from '../_components/locator';
import { PricingContent } from '../_components/pricing';
import { WhyUse } from '../_components/whyUse';

const Index = async () => {
  const api = await getApi();
  const country = await getUserCountry();
  const currency = getCurrencyFromCountry(country);
  const products = await api.get<Products>(`/products?currency=${currency}`);

  return (
    <WebsiteLayout>
      <main className="s-main overflow-hidden pb-10 lg:px-6">
        <Hero defaultCountry={country} />
        <AlwaysKnowWhoCalled className="container-wide" />
        <hr className="separator m-0 container-wide lg:mx-auto lg:block" />
        <div className="px-4 lg:px-6">
          <Locator defaultCountry={country} className="container-content py-8 lg:py-14" labelClassName="font-bold" />
        </div>
        <WhyUse defaultCountry={country} />
        <PricingContent country={country} currency={currency} products={products} />
        <CustomerCarousel className="container-wide px-4 py-8 lg:px-0 lg:py-20" />
        <LatestResults className="container-wide" country={country} />
        <hr className="separator m-0 container-wide lg:mx-auto lg:block" />
        <FAQs className="container-wide px-4 py-8 lg:px-0 lg:py-20" id="faq">
          <FAQs.Title />
          <FAQs.Content className="rounded-3xl bg-alternate px-5 lg:px-10 lg:py-4" />
        </FAQs>
        <InstantLocator defaultCountry={country} />
      </main>
    </WebsiteLayout>
  );
};

export default Index;
