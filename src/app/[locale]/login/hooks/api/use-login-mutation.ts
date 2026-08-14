import { useMutation } from '@tanstack/react-query';

import type { LoginFormValues } from '@/app/[locale]/login/types/login.types';
import { signIn } from '@/server/session/session.actions';

async function loginFunction(data: LoginFormValues) {
  const { data: result } = await signIn({ email: data.email, password: data.password });

  /*
   * A missing result is the action itself having failed — a rejected input or
   * an unhandled throw. Either way there is no session, which is what the form
   * needs to know.
   */
  if (!result?.success) {
    throw new Error(result?.error ?? 'unavailable');
  }
}

export function useLoginMutation({ onSuccess, onError }: { onSuccess: () => void; onError: (error: Error) => void }) {
  return useMutation({
    mutationFn: loginFunction,
    onSuccess,
    onError,
  });
}
