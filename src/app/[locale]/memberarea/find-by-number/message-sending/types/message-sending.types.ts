import { z } from 'zod';

const MAX_CHARACTERS = 100;

export const createMessageSendingSchema = (t: (...args: any[]) => string) =>
  z.object({
    phone: z.string(),
    message: z
      .string()
      .min(1, { message: t('errors.empty') })
      .max(MAX_CHARACTERS, { message: t('errors.max_length', { n: MAX_CHARACTERS }) }),
  });

export type MessageSendingFormValues = z.infer<ReturnType<typeof createMessageSendingSchema>>;
export type SubmitFn = (data: MessageSendingFormValues) => void;
