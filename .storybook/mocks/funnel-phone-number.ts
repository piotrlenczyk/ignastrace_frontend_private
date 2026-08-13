/*
 * Stand-in for src/actions/funnel-phone-number.ts.
 *
 * The real module is a `'use server'` file: it reaches for `next/headers` and the
 * NextAuth config at import time, neither of which exists in a browser. Aliasing
 * it (see main.ts) keeps the *form* real — schema, validation, submit path — while
 * the one call that crosses the server boundary resolves here.
 */
export async function saveFunnelPhone(phoneNumber: string): Promise<void> {
  console.info('[storybook] saveFunnelPhone', phoneNumber);
}

export async function getFunnelPhone(): Promise<string | undefined> {
  return undefined;
}
