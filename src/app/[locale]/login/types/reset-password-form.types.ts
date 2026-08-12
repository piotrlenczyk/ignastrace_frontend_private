import { z } from 'zod';

export const createForgotPasswordSchema = (t: (...args: any[]) => string) =>
  z.object({
    email: z.string().email({ message: t('errors.invalid_email') }),
  });

export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordSchema>>;
export type SubmitFn = (data: ForgotPasswordFormValues) => void;
