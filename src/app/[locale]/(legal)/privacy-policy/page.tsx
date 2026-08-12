/* eslint-disable react-dom/no-dangerously-set-innerhtml */
import { getLocale } from 'next-intl/server';

import { ROUTES } from '@/constants/routes';
import { useAuthenticatedRedirect } from '@/hooks/use-auth-redirect';
import { getTranslatedHtml } from '@/libs/server/i18n-html-content';

export default async function PrivacyPolicyPage() {
  await useAuthenticatedRedirect({
    activeSubscriptionRoute: ROUTES.MEMBER.PRIVACY_POLICY,
    endedSubscriptionRoute: ROUTES.MEMBER.SETTINGS.BILLING,
  });
  const locale = await getLocale();
  const translatedContent = await getTranslatedHtml('privacy-policy', locale);

  return (
    <div dangerouslySetInnerHTML={{ __html: translatedContent }} />
  );
}
