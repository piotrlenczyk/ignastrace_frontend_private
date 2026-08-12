import { z } from 'zod';

export const createLoginSchema = (t: (...args: any[]) => string) =>
  z.object({
    email: z.string().email({ message: t('errors.invalid_email') }),
    password: z.string().min(6, { message: t('errors.password_min_length') }),
  });

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
