import { getTranslations } from 'next-intl/server';

import { ContactInformation } from '@/app/[locale]/contact/components/contact-information';
import { ContactForm } from '@/app/[locale]/contact/form';
import { FAQs } from '@/components/homepage/faqs';
import { resolveLocale } from '@/libs/i18n-routing';

import { LogoutButton } from '../_components/logout-button';

const GetHelpPage = async (props: PageProps<'/[locale]/memberarea/settings/get-help'>) => {
  const t = await getTranslations({
    locale: resolveLocale((await props.params).locale),
    namespace: 'pages.contact',
  });

  return (
    <div className="flex flex-col gap-4">
      <FAQs>
        <FAQs.Title variant="inline " />
        <FAQs.Content />
      </FAQs>
      <hr className="mb-4 border-stroke-weak" />
      <div className="grid gap-6">
        <h1 className="h4 font-bold">
          {t('contact_information.title')}
        </h1>
        {/* eslint-disable-next-line react-dom/no-dangerously-set-innerhtml */}
        <div dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
        <ContactInformation />
      </div>
      <hr className="mb-4 border-stroke-weak" />
      <ContactForm />

      <LogoutButton className="mb-6" />
    </div>
  );
};

export default GetHelpPage;
