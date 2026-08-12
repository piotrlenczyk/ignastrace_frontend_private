/* eslint-disable react-dom/no-dangerously-set-innerhtml */
import { getLocale } from 'next-intl/server';

import ProductLayout from '@/components/layouts/product-layout';
import { getTranslatedHtml } from '@/libs/server/i18n-html-content';

export default async function PrivacyPolicyPage() {
  const locale = await getLocale();
  const translatedContent = await getTranslatedHtml('privacy-policy', locale);

  return (
    <ProductLayout>
      <main className="flex flex-col px-4 py-6 lg:px-6">
        <div className="content-html container-wide">
          <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
        </div>
      </main>
    </ProductLayout>
  );
}
