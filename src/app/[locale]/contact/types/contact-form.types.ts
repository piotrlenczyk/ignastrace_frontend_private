import { z } from 'zod';

import { type components } from '@/network/api/api';

type ContactUsDto = components['schemas']['ContactUsDto'];

/*
 * The API's limits, restated because the generated types drop them —
 * `openapi-typescript` keeps `maxLength` as documentation and nothing else. They
 * are here rather than looser so that an over-long message is a validation
 * message under the field, which is what the visitor can act on, instead of a
 * 400 read back as a generic failure toast.
 */
// TODO: [refactor] previously was 500, now is 250
const MAX_MESSAGE_CHARACTERS = 250;
// TODO: [refactor] previously was 150, now is 100
const MAX_FIELD_CHARACTERS = 100;

/**
 * The subjects the API accepts, in the order the form offers them. `satisfies`
 * is what ties the list to the specification: retire one of these upstream and
 * this stops compiling rather than starting to fail at run time. An upstream
 * *addition* still compiles — the form simply goes on offering the four it knows,
 * which is the safe direction for the visitor.
 */
export const CONTACT_SUBJECTS = [
  'BILLING',
  'TECHNICAL',
  'SUGGESTION',
  'OTHER',
] as const satisfies readonly ContactUsDto['subject'][];

/**
 * The translation key each subject is labelled with — a `Record` over the subject
 * union rather than a second list, so a subject added above has to be given a
 * label here before this compiles. The form renders the options from these two
 * together and states neither the codes nor the labels itself.
 *
 * `as const` before the `satisfies`, not a `Record<…, string>` annotation: the
 * keys have to stay literal types for next-intl to check them against the
 * message catalogue at the call site.
 */
export const CONTACT_SUBJECT_LABEL_KEYS = {
  BILLING: 'billing_question',
  TECHNICAL: 'technical_issue',
  SUGGESTION: 'suggested_improvement',
  OTHER: 'other',
} as const satisfies Record<(typeof CONTACT_SUBJECTS)[number], string>;

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
    email: z
      .email({ message: t('errors.invalid_email') })
      .max(MAX_FIELD_CHARACTERS, { message: t('errors.max_length') }),
    subject: z.enum(CONTACT_SUBJECTS),
    message: z
      .string()
      .min(1, { message: t('errors.message_required') })
      .max(MAX_MESSAGE_CHARACTERS, { message: t('errors.message_max_length', { maxLength: MAX_MESSAGE_CHARACTERS }) }),
    locale: z.string(),
  });

/**
 * What the form collects — and, because every field is named and typed as the
 * API names and types it, what the API is sent. Nothing maps between the two;
 * the mutation hook takes these values as the request body, and that call is
 * where the two shapes are checked against each other.
 */
export type ContactUsFormValues = z.infer<ReturnType<typeof contactUsCreateSchema>>;
export type SubmitFn = (data: ContactUsFormValues) => void;
