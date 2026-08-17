import { z } from 'zod';

import { LINK_NAME_MAX_CHARACTERS } from '@/server/actions/location-request.schemas';

/** The action's bound, worded for the member. The number itself is stated once. */
const MAX_CHARACTERS = LINK_NAME_MAX_CHARACTERS;

export const createLinkLocationSchema = (t: (...args: any[]) => string) =>
  z.object({
    name: z
      .string()
      .min(1, { message: t('errors.required') })
      .max(MAX_CHARACTERS, { message: t('errors.max_length', { n: MAX_CHARACTERS }) }),
  });

export type CreateLinkFormValues = z.infer<ReturnType<typeof createLinkLocationSchema>>;
export type SubmitFn = (data: CreateLinkFormValues) => void;
