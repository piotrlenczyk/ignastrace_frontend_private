import { z } from 'zod';

/*
 * What the account actions accept. They live here rather than beside the actions
 * because a `'use server'` module may only export async functions, and separately
 * from the settings form's own schema because that one is built per render around
 * translated messages — this validates the input, not the wording.
 */

/**
 * A profile edit, optionally carrying a password change.
 *
 * The two password fields travel together or not at all: the API verifies the
 * current one before it accepts a new one, so half a change is not a request the
 * endpoint can serve.
 */
export const updateAccountSchema = z
  .object({
    name: z.string().min(1),
    email: z.email(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .refine((input) => !!input.currentPassword === !!input.newPassword, {
    message: 'A password change needs both the current password and the new one.',
    path: ['newPassword'],
  });
