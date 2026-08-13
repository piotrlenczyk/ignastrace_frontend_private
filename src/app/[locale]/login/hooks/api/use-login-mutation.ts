import { useMutation } from '@tanstack/react-query';

import type { LoginFormValues } from '@/app/[locale]/login/types/login.types';
import { signIn } from '@/server/session/session.actions';

async function loginFunction(data: LoginFormValues) {
  const result = await signIn({ email: data.email, password: data.password });

  if (!result.success) {
    throw new Error(result.error);
  }
}

export function useLoginMutation({ onSuccess, onError }: { onSuccess: () => void; onError: (error: Error) => void }) {
  return useMutation({
    mutationFn: loginFunction,
    onSuccess,
    onError,
  });
}
