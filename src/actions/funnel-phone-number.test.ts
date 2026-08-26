import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { schemas } from '@/network/api/apiServerClient';
/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { cookieJar, resetKit, serveApi, signedIn } from '@/test/server-write-kit';

const { getFunnelPhone, saveFunnelPhone } = await import('./funnel-phone-number');

/*
 * The funnel's phone fallback: the number this run typed, then the number the
 * account was signed up with, then nothing.
 *
 * The precedence is the whole behaviour, and it is worth a test here because the
 * second step used to be answered by a fixture — every member had the same
 * invented number, and the "nothing is known" branch was unreachable. It reads
 * the account service now, so all three answers are real and all three are
 * exercised.
 *
 * Nothing of this application is substituted: the cookie jar and `fetch` are the
 * only boundaries, which is the same seam the subscription gate's test drives.
 */

const ACCOUNT_PATH = '/api/v1/user/me';

const ONBOARDING_NUMBER = '+12025550143';
const TYPED_NUMBER = '+14155550101';

/** As much of the account service's response as this fallback reads. */
const account = (overrides: Partial<schemas['UserResponse']>): schemas['UserResponse'] => ({
  id: '0f2fd8ef-2f0a-4c2b-9f30-6f8a6d6f5a11',
  email: 'member@example.com',
  name: 'A Member',
  isBlocked: false,
  unlimitedPdfDownloadsUnlocked: false,
  notifyStatusChanges: true,
  notifyUserLocated: true,
  onboardingPhoneNumber: null,
  type: 'USER',
  status: 'ACTIVE',
  photo: null,
  ...overrides,
});

const serveAccount = (overrides: Partial<schemas['UserResponse']>) =>
  serveApi({ [ACCOUNT_PATH]: { status: 200, body: account(overrides) } });

beforeEach(async () => {
  resetKit();
  await signedIn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getFunnelPhone()', () => {
  it('answers with the number typed into this run, whatever the account holds', async () => {
    serveAccount({ onboardingPhoneNumber: ONBOARDING_NUMBER });
    await saveFunnelPhone(TYPED_NUMBER);

    await expect(getFunnelPhone()).resolves.toBe(TYPED_NUMBER);
  });

  it('does not ask the account service at all when this run typed a number', async () => {
    const api = serveAccount({ onboardingPhoneNumber: ONBOARDING_NUMBER });
    await saveFunnelPhone(TYPED_NUMBER);

    await getFunnelPhone();

    expect(api.paths()).not.toContain(ACCOUNT_PATH);
  });

  it('falls back to the number the member supplied at signup', async () => {
    serveAccount({ onboardingPhoneNumber: ONBOARDING_NUMBER });

    await expect(getFunnelPhone()).resolves.toBe(ONBOARDING_NUMBER);
  });

  it('answers with nothing for a member who supplied no number at signup', async () => {
    serveAccount({ onboardingPhoneNumber: null });

    await expect(getFunnelPhone()).resolves.toBeUndefined();
  });

  it('answers with nothing for a visitor with no session, without asking the account service', async () => {
    const api = serveAccount({ onboardingPhoneNumber: ONBOARDING_NUMBER });
    cookieJar.clear();

    await expect(getFunnelPhone()).resolves.toBeUndefined();
    expect(api.paths()).toEqual([]);
  });
});
