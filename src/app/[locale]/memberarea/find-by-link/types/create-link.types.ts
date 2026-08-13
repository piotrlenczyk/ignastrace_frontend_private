import { z } from 'zod';

const MAX_CHARACTERS = 255;

export const createLinkLocationSchema = (t: (...args: any[]) => string) =>
  z.object({
    name: z
      .string()
      .min(1, { message: t('errors.required') })
      .max(MAX_CHARACTERS, { message: t('errors.max_length', { n: MAX_CHARACTERS }) }),
  });

export type CreateLinkFormValues = z.infer<ReturnType<typeof createLinkLocationSchema>>;
export type SubmitFn = (data: CreateLinkFormValues) => void;
