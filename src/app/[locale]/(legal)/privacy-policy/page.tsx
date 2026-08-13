import { getLocale } from 'next-intl/server';

import { ROUTES } from '@/constants/routes';
import { redirectIfAuthenticated } from '@/hooks/auth-redirect';
import { getTranslatedHtml } from '@/libs/server/i18n-html-content';

export default async function PrivacyPolicyPage() {
  await redirectIfAuthenticated({
    activeSubscriptionRoute: ROUTES.MEMBER.PRIVACY_POLICY,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });
  const locale = await getLocale();
  const translatedContent = await getTranslatedHtml('privacy-policy', locale);

  return <div dangerouslySetInnerHTML={{ __html: translatedContent }} />;
}
