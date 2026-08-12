import { z } from 'zod';

export const createCancellationFormSchema = (t: (...args: any[]) => string) =>
  z
    .object({
      email: z.string().email({ message: t('errors.invalid_email') }),
    });

export type CancellationFormValues = z.infer<ReturnType<typeof createCancellationFormSchema>>;
