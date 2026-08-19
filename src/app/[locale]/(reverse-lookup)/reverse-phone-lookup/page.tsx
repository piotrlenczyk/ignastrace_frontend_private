import WebsiteLayoutV2 from '@/components/layouts/website-layout-v2';
import { getServerSettings } from '@/settings/settings.server';

import { CustomerCarousel } from '../_components/customerCarousel';
import { FAQs } from '../_components/faqs';
import { Locator } from '../_components/locator';
import { Cta } from '../_components/v2/cta';
import { FullReport } from '../_components/v2/full-report';
import { Hero } from '../_components/v2/hero';
import { WhyUse } from '../_components/whyUse';

/*
 * Section order follows the Figma frame (13002:131636): hero → logos → "How can a
 * lookup help?" → "Get the full report" → testimonials → locator → FAQ → "Why
 * choose over basic search?" → CTA.
 *
 * `PricingContent` and `LatestResults` are gone, per the decision to match the
 * design exactly — the design has neither. Dropping pricing also removed this
 * page's `getApi()` / `/products?currency=` fetch and the `getCurrencyFromCountry`
 * call, which existed only to feed it. That is a behaviour change, made
 * deliberately and not a side effect of restyling.
 *
 * `FullReport` replaces `AlwaysKnowWhoCalled` rather than joining it. They are the
 * same section: the legacy one lists Full Name / Home Address / Family Members /
 * Social Media / Email / Location History / Web Activity under "Always know who's
 * calling with Mobitrace", which is what the design renames "Get the full report
 * with Ignastrace" and trims to six. Rendering both duplicated the content and the
 * subtitle almost word for word.
 *
 * `Locator`, `CustomerCarousel`, `WhyUse` and `FAQs` are still the legacy
 * components, standing in at their designed positions until they are rebuilt. Two
 * sections have no stand-in and are not rendered yet: the logos strip and
 * "How can a phone number lookup help?".
 */
const Index = async () => {
  const country = (await getServerSettings()).countryCode;

  return (
    <WebsiteLayoutV2>
      <main className="overflow-hidden">
        <Hero defaultCountry={country} />
        <FullReport />
        <CustomerCarousel className="container-page px-4 py-8 lg:px-0 lg:py-20" />
        <div className="px-4 lg:px-6">
          <Locator defaultCountry={country} className="container-content py-8 lg:py-14" labelClassName="font-bold" />
        </div>
        <FAQs className="container-page px-4 py-8 lg:px-0 lg:py-20" id="faq">
          <FAQs.Title />
          <FAQs.Content className="rounded-3xl bg-alternate px-5 lg:px-10 lg:py-4" />
        </FAQs>
        <WhyUse defaultCountry={country} />
        <Cta defaultCountry={country} />
      </main>
    </WebsiteLayoutV2>
  );
};

export default Index;
