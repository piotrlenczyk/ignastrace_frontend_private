import { getTranslations } from 'next-intl/server';

import WebsiteLayout from '@/components/layouts/website-layout';
import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';

import { ContactInformation } from './components/contact-information';
import { ContactForm } from './form';

export default async function Contact() {
  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.MEMBER.SETTINGS.GET_HELP,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });

  const t = await getTranslations('pages.contact');

  return (
    <WebsiteLayout>
      <main className={`
        container container-wide flex flex-col gap-12 p-6 [grid-area:main]
        md:grid md:grid-cols-2 md:gap-8 md:py-8
      `}
      >
        <section className="flex flex-col gap-6">
          <h1 className="font-bold">
            {t('title')}
          </h1>
          <div dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
          <h2 className="h4 font-bold">
            {t('contact_information.title')}
          </h2>
          <ContactInformation />
        </section>
        <ContactForm variant="brand" />
      </main>
    </WebsiteLayout>
  );
}
