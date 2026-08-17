import { z } from 'zod';

import { MESSAGE_MAX_CHARACTERS } from '@/server/actions/location-request.schemas';

export const createMessageSendingSchema = (t: (...args: any[]) => string) =>
  z.object({
    phone: z.string(),
    message: z
      .string()
      .min(1, { message: t('errors.empty') })
      .max(MESSAGE_MAX_CHARACTERS, { message: t('errors.max_length', { n: MESSAGE_MAX_CHARACTERS }) }),
  });

export type MessageSendingFormValues = z.infer<ReturnType<typeof createMessageSendingSchema>>;
export type SubmitFn = (data: MessageSendingFormValues) => void;
