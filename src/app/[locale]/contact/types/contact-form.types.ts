import { z } from 'zod';

const MAX_CHARACTERS = 500;
const MAX_FIELD_CHARACTERS = 150;

export const contactUsCreateSchema = (t: (...args: any[]) => string) =>
  z.object({
    name: z
      .string()
      .min(1, { message: t('errors.name_required') })
      .max(MAX_FIELD_CHARACTERS, { message: t('errors.max_length') })
      .regex(/^[a-záéíóúñ\s]+$/i, { message: t('errors.invalid_name_format') }),
    surname: z
      .string()
      .min(1, { message: t('errors.surname_required') })
      .max(MAX_FIELD_CHARACTERS, { message: t('errors.max_length') })
      .regex(/^[a-záéíóúñ\s]+$/i, { message: t('errors.invalid_surname_format') }),
    email: z.email({ message: t('errors.invalid_email') }),
    subject: z.string().min(1),
    message: z
      .string()
      .min(1, { message: t('errors.message_required') })
      .max(MAX_CHARACTERS, { message: t('errors.message_max_length', { maxLength: MAX_CHARACTERS }) }),
    locale: z.string(),
  });

export type ContactUsFormValues = z.infer<ReturnType<typeof contactUsCreateSchema>>;
export type SubmitFn = (data: ContactUsFormValues) => void;
