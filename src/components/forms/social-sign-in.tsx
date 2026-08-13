import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

import { Button } from '../ui/button';

/*
 * Social sign-in is off while the session runs on the new API. That API expects
 * the client to hand it an authorisation code it obtained itself, and building
 * that handshake is separate work — see docs/adr/0008-*. Until it exists the
 * buttons stay where the visitor expects them, disabled and explained, rather
 * than disappearing or failing silently under the click.
 *
 * There is no brand icon set in this project, so both providers carry the
 * generic `globe` the Google button already used.
 */
export const SocialSignIn = () => {
  const t = useTranslations('pages.sign_up.components.sign_up_form');
  const tNew = useTranslations('__NEW__.social_sign_in');

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        variant="outline"
        disabled
        aria-describedby="social-sign-in-unavailable"
        className="text-start disabled:opacity-60"
      >
        <Icon name="globe" />
        {t('continue_with_google')}
      </Button>
      <Button
        size="lg"
        variant="outline"
        disabled
        aria-describedby="social-sign-in-unavailable"
        className="text-start disabled:opacity-60"
      >
        <Icon name="globe" />
        {t('continue_with_facebook')}
      </Button>
      <p id="social-sign-in-unavailable" className="text-center text-sm text-weak">
        {tNew('unavailable')}
      </p>
    </div>
  );
};
