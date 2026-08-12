import { z } from 'zod';

export const createSexOffenderSearchSchema = (t: (...args: any[]) => string) =>
  z.object({
    first_name: z.string().min(1, { message: t('errors.first_name_required') }),
    last_name: z.string().min(1, { message: t('errors.last_name_required') }),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
  });

export type SexOffenderSearchFormValues = z.infer<ReturnType<typeof createSexOffenderSearchSchema>>;
