import { z } from 'zod';

export const createSignUpSchema = (t: (...args: any[]) => string) =>
  z.object({
    email: z.string().email({ message: t('errors.invalid_email') }),
    onboarding_phone_number: z.string(),
    locale: z.string(),
    country: z.string().optional(),
  });

export type SignUpFormValues = z.infer<ReturnType<typeof createSignUpSchema>>;
