import { useMutation } from '@tanstack/react-query';
import { useLocale } from 'next-intl';

import { register } from '@/server/session/session.actions';
import type { RegistrationError } from '@/server/session/session.operations';
import type { SignUpFormValues } from '@/types/sign-up.types';

/**
 * A refused registration, carrying why. Thrown rather than returned because
 * that is the channel react-query gives a mutation for a failure.
 */
export class SignUpError extends Error {
  constructor(readonly reason: RegistrationError) {
    super(reason);
    this.name = 'SignUpError';
  }
}

/**
 * Registers on the new API and, on success, leaves the visitor signed in — the
 * server action writes the session cookies before this resolves, so the caller
 * only has to navigate.
 */
export function useSignUpMutation({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (error: SignUpError) => void;
}) {
  const locale = useLocale();

  async function signUpFunction({ email }: SignUpFormValues) {
    const result = await register({ email, locale });

    if (!result.success) {
      throw new SignUpError(result.error);
    }
  }

  return useMutation<void, SignUpError, SignUpFormValues>({
    mutationFn: signUpFunction,
    onSuccess,
    onError,
  });
}
