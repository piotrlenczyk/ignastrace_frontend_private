import { z } from 'zod';

import type { components as apiComponents } from '@/network/api/api';

/**
 * What the form collects, in the new API's own spelling.
 *
 * No adapter sits at the boundary translating one vocabulary into another — the
 * retirement track forbids it — so the field names here are the request body's
 * and the screen reads them directly.
 *
 * **The sentinel for "all states" lives in the schema rather than in the form.**
 * A Radix `Select.Item` throws at run time on an empty-string value, so the
 * control needs a word for "no filter", and `SEARCH_ALL_STATES` is that word. It
 * never leaves this application: `sexOffenderSearchBody` below turns it back into
 * an absent filter.
 *
 * No length limits, deliberately. The upstream caps these fields, but every
 * message this form shows lives on a legacy translation key and the screen is
 * awaiting redesign — so four new strings would be copy written to be deleted.
 */
export const SEARCH_ALL_STATES = 'all';

export const createSexOffenderSearchSchema = (t: (...args: any[]) => string) =>
  z.object({
    firstName: z.string().min(1, { message: t('errors.first_name_required') }),
    lastName: z.string().min(1, { message: t('errors.last_name_required') }),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
  });

export type SexOffenderSearchFormValues = z.infer<ReturnType<typeof createSexOffenderSearchSchema>>;

/** A field the member left empty, which is not a filter at all. */
const orOmitted = (value: string | undefined) => value || undefined;

/**
 * The request body a set of form values makes.
 *
 * An unfilled city, state or ZIP is **left out** rather than sent as an empty
 * string: where the upstream distinguishes the two, a search for what the member
 * typed is the easier position to defend than a search for three empty strings.
 * The "all states" sentinel resolves the same way, to no filter at all.
 */
export const sexOffenderSearchBody = ({
  firstName,
  lastName,
  city,
  state,
  zipCode,
}: SexOffenderSearchFormValues): apiComponents['schemas']['CreateSexOffenderSearchDto'] => ({
  firstName,
  lastName,
  city: orOmitted(city),
  state: state === SEARCH_ALL_STATES ? undefined : orOmitted(state),
  zipCode: orOmitted(zipCode),
});
