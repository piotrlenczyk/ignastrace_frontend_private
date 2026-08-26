import { getLocale } from 'next-intl/server';

import { ROUTES } from '@/constants/routes';
import { getTranslatedHtml } from '@/libs/server/i18n-html-content';
import { redirectIfAuthenticated } from '@/libs/subscription';

export default async function TermsAndConditionsPage() {
  await redirectIfAuthenticated({
    activeSubscription: ROUTES.MEMBER.TERMS,
    endedSubscription: ROUTES.MEMBER.SETTINGS.BILLING,
  });
  const locale = await getLocale();

  const translatedContent = await getTranslatedHtml('terms', locale, 'terms');
  return <div dangerouslySetInnerHTML={{ __html: translatedContent }} />;
}
