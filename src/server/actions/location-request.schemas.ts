import { z } from 'zod';

/*
 * What the Location request actions accept. They live here rather than beside the
 * actions because a `'use server'` module may only export async functions, and
 * separately from each screen's own schema because those are built per render
 * around translated messages — this validates the input, not the wording.
 */

/**
 * The longest link name a member may give a Location request.
 *
 * The naming form's own schema states the same bound with a translated message,
 * and reads it from here so the two cannot drift apart.
 */
export const LINK_NAME_MAX_CHARACTERS = 255;

/**
 * The one thing a link-type Location request carries: the name the member typed.
 *
 * The type discriminator is not part of the input. It is what this action *is*,
 * not something a caller chooses — the API forbids a phone number on a
 * FIND_BY_LINK request and a link name on a FIND_BY_NUMBER one, so the pairing
 * belongs in the action rather than in what the form may send.
 */
export const createLinkLocationRequestSchema = z.object({
  linkName: z.string().min(1).max(LINK_NAME_MAX_CHARACTERS),
});

/**
 * The longest notice a member may send with a Location request by SMS.
 *
 * The specification states a larger bound, and it is deliberately not adopted: the
 * bound upstream is a ceiling that the backend's own configuration lowers, and the
 * running configuration lowers it to this. Raising the field to the specification's
 * number would let a member write a message the deployment then refuses.
 *
 * The compose form's schema states the same bound with a translated message, and
 * reads it from here so the two cannot drift apart.
 */
export const MESSAGE_MAX_CHARACTERS = 100;

/**
 * What a number-type Location request carries: who to ask, and what to say.
 *
 * As with the link-type schema, the type discriminator is not part of the input —
 * the API forbids a link name on a `FIND_BY_NUMBER` request, so the pairing belongs
 * in the action rather than in what the form may send.
 */
export const createNumberLocationRequestSchema = z.object({
  phoneNumber: z.string().min(1),
  message: z.string().min(1).max(MESSAGE_MAX_CHARACTERS),
});
