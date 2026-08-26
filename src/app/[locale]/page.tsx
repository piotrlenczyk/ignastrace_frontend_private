import { getTranslations } from 'next-intl/server';

import { FAQs } from '@/components/homepage/faqs';
import { Hero } from '@/components/homepage/hero';
import { HowDoesItWork } from '@/components/homepage/howDoesItWork';
import { InstantLocator } from '@/components/homepage/instantLocator';
import { Locator } from '@/components/homepage/locator';
import { WhyChoose } from '@/components/homepage/whyChoose';
import WebsiteLayout from '@/components/layouts/website-layout';
import { ROUTES } from '@/constants/routes';
import { resolveLocale } from '@/libs/i18n-routing';
import { redirectIfAuthenticated } from '@/libs/subscription';
import { getServerSettings } from '@/settings/settings.server';

export async function generateMetadata(props: PageProps<'/[locale]'>) {
  const t = await getTranslations({
    locale: resolveLocale((await props.params).locale),
    namespace: 'pages.index',
  });

  return {
    title: t('meta_title'),
    openGraph: {
      title: t('og_title'),
      description: t('og_description'),
    },
  };
}

const Index = async () => {
  const country = (await getServerSettings()).countryCode;

  await redirectIfAuthenticated({
    activeSubscription: ROUTES.MEMBER.FIND_BY_NUMBER.HOME,
    endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  return (
    <WebsiteLayout>
      <main className="s-main overflow-hidden pb-10 lg:px-6">
        <Hero defaultCountry={country} />
        <HowDoesItWork className="container-wide" />
        <hr className="separator container-wide mt-0 mb-4 hidden lg:block" />
        <div className="px-6">
          <Locator defaultCountry={country} className="container-content py-10" labelClassName="font-bold" />
        </div>
        <WhyChoose defaultCountry={country} />
        <FAQs className="container-wide px-4 py-6 lg:px-0 lg:py-20" id="faq">
          <FAQs.Title />
          <FAQs.Content className="rounded-3xl bg-alternate px-4 py-3 lg:px-10 lg:py-4" />
        </FAQs>
        <InstantLocator defaultCountry={country} />
      </main>
    </WebsiteLayout>
  );
};

export default Index;
