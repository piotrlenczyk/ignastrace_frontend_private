import { z } from 'zod';

export const createMyAccountFormSchema = (t: (...args: any[]) => string) =>
  z
    .object({
      name: z.string()
        .min(3, { message: t('errors.name_required') })
        .max(150, { message: t('errors.name_max_length', { maxLength: 150 }) })
        .regex(/^\D+$/, {
          message: t('errors.name_invalid_characters'),
        })
        .refine(value => !/[!@#$%^&*()_+=[\]{};:"\\|,.<>/?]/.test(value), {
          message: t('errors.name_invalid_special_characters'),
        }),
      email: z.string()
        .email({ message: t('errors.invalid_email') })
        .max(100, { message: t('errors.email_max_length', { maxLength: 100 }) }),
      notify_status_changes: z.boolean(),
      notify_user_located: z.boolean(),
      current_password: z.string().optional(),
      password: z.string()
        .max(128, { message: t('errors.password_max_length', { maxLength: 128 }) })
        .optional(),
      confirm_password: z.string()
        .max(128, { message: t('errors.password_max_length', { maxLength: 128 }) })
        .optional(),
    })
    .refine(data => !(data.password && !data.current_password), {
      message: t('errors.current_password_required'),
      path: ['current_password'],
    })
    .refine(data => !(data.current_password && !data.password), {
      message: t('errors.new_password_required'),
      path: ['password'],
    })
    .refine(data => !(data.current_password && (data.password === data.current_password)), {
      message: t('errors.new_password_must_differ_from_current_password'),
      path: ['password'],
    })
    .refine(data => !(data.password && !data.confirm_password), {
      message: t('errors.confirm_password_required'),
      path: ['confirm_password'],
    })
    .refine((data) => {
      if (!data.password) {
        return true;
      }
      return data.password.length >= 6 && data.password === data.confirm_password;
    }, {
      message: t('errors.passwords_must_match'),
      path: ['confirm_password'],
    })
    .refine(data => !data.password || data.password.length >= 6, {
      message: t('errors.password_min_length'),
      path: ['password'],
    });

export type MyAccountFormValues = z.infer<ReturnType<typeof createMyAccountFormSchema>>;
