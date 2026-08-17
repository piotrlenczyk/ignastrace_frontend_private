import { z } from 'zod';

/*
 * What the session actions accept. They live here rather than beside the
 * actions because a `'use server'` module may only export async functions, and
 * separately from the forms' own schemas because those are built per render
 * around translated messages — these validate the input, not the wording.
 */

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const registrationSchema = z.object({
  email: z.email(),
});
