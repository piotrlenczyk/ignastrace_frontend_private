'use client';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Button } from '../ui/button';
import { IconGoogleBrand } from '../ui/icon/icons/GoogleBrand';

export const SocialSignIn = ({ redirectTo }: { redirectTo: string }) => {
  const t = useTranslations('pages.sign_up.components.sign_up_form');

  const handleGoogleSignIn = () => {
    signIn('google', { redirectTo });
  };

  return (
    <Button size="lg" variant="outline" onClick={handleGoogleSignIn} className="text-start">
      <IconGoogleBrand size="large" />
      {t('continue_with_google')}
    </Button>
  );
};
