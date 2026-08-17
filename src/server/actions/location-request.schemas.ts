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
