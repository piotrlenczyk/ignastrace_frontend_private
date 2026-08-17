import { z } from 'zod';

/*
 * The new API mints the password itself and mails it to the address, so an
 * email is the whole of what registration asks for. The funnel's phone number
 * stays where the funnel put it — a cookie read by `getFunnelPhone` — rather
 * than riding along on the account.
 */
export const createSignUpSchema = (t: (...args: any[]) => string) =>
  z.object({
    email: z.email({ message: t('errors.invalid_email') }),
  });

export type SignUpFormValues = z.infer<ReturnType<typeof createSignUpSchema>>;
