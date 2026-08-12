import { z } from 'zod';

export const stripeCreditCardSchema = (t: (...args: any[]) => string) =>
  z.object({
    cardName: z.string()
      .min(1, { message: t('errors.card_name_required') })
      .refine(value => /^[^0-9!@#$%^&*()_+=[\]{};:"\\|,.<>/?]+$/.test(value), {
        message: t('errors.name_invalid_characters'),
      }),
    cardNumber: z.string().optional(),
    expirationDate: z.string().optional(),
    cvc: z.string().optional(),
    zipCode: z.string()
      .optional()
      .refine((value) => {
        if (!value || value === '') {
          return true;
        }
        return /^\d{5}(-\d{4})?$/.test(value);
      }, {
        message: t('errors.zip_code_invalid_format'),
      }),
  });

export type StripeFormValues = z.infer<ReturnType<typeof stripeCreditCardSchema>>;
