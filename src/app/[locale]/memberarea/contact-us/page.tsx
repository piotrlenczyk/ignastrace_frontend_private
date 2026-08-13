import { getTranslations } from 'next-intl/server';

import ProductLayout from '@/components/layouts/product-layout';

import { ContactInformation } from '../../contact/components/contact-information';
import { ContactForm } from '../../contact/form';

export default async function ContactUsPage() {
  const t = await getTranslations('pages.contact');

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 py-6 lg:px-6">
        <h1 className="h3 font-bold">
          {t('contact_us')}
        </h1>
        <hr className="mt-6 mb-4 border-stroke-weak" />
        <div className="flex flex-col gap-4">
          <h2 className="h4 font-bold">
            {t('title')}
          </h2>
          <div dangerouslySetInnerHTML={{ __html: t.raw('subtitle') }} />
          <ContactInformation />
        </div>
        <hr className="my-4 border-stroke-weak" />
        <div className="max-w-(--breakpoint-sm)">
          <ContactForm />
        </div>
      </main>
    </ProductLayout>
  );
}
