'use client';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

import { Button } from '../ui/button';

export const SocialSignIn = ({ redirectTo }: { redirectTo: string }) => {
  const t = useTranslations('pages.sign_up.components.sign_up_form');

  const handleGoogleSignIn = () => {
    signIn('google', { redirectTo });
  };

  return (
    <Button size="lg" variant="outline" onClick={handleGoogleSignIn} className="text-start">
      <Icon name="globe" />
      {t('continue_with_google')}
    </Button>
  );
};
