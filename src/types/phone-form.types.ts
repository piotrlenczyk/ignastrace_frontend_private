import { isValidPhoneNumber } from 'libphonenumber-js';
import { z } from 'zod';

export const createPhoneFormSchema = (t: (...args: any[]) => string) =>
  z.object({
    phone: z.string().refine((phone) => isValidPhoneNumber(phone), { message: t('errors.invalid_phone') }),
  });

export type PhoneFormValues = z.infer<ReturnType<typeof createPhoneFormSchema>>;
