import { useSession } from '@/hooks/use-session';
import type { components } from '@/network/api/api';
import { $api } from '@/network/api/api-browser-client';

type ISO6391LanguageCode = components['schemas']['ISO6391LanguageCode'];

/**
 * Stores the language a member picked against their account.
 *
 * The interface switches either way. Whether the preference outlives the visit is
 * the backend's business — a visitor with no account has nowhere to store one, and
 * a language the API refuses is still a language this site is translated into — so
 * the switch is not made to wait on the answer, and a refusal goes to `onError`.
 *
 * The locale is sent as the application holds it. The operation's description
 * mentions two languages, but the generated type is the full ISO-639-1 set, so
 * every locale this site offers is a value the request may legally carry.
 */
export function useUpdateLocaleMutation({
  onSuccess,
  onError,
}: {
  onSuccess: (locale: string) => void;
  onError: (error: unknown) => void;
}) {
  const { isSignedIn } = useSession();

  const { mutate } = $api.useMutation('post', '/api/v1/user/me/language', { onError });

  const updateLocale = (locale: string) => {
    if (isSignedIn) {
      mutate({ body: { language: locale as ISO6391LanguageCode } });
    }

    onSuccess(locale);
  };

  return { mutate: updateLocale };
}
