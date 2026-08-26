import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { beforeEach, describe, expect, it } from 'vitest';

import { isAccountNotFoundActionError } from '@/server/lib/auth-action-error';
import { isHttpClientActionError } from '@/server/lib/safe-action';
/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { paymentsRefusal, refusal, resetKit, serveApi } from '@/test/server-write-kit';

/*
 * The public cancellation, driven the way the form on `/cancellation` drives it:
 * an address in, an action result out.
 *
 * What this seam is for is the promise the screen makes and cannot check from
 * inside itself — that the subscription cancelled is the one belonging to the
 * address that was typed. The endpoint cancels by user id and the form collects
 * an address, so the action stands between two upstreams and a mistake there
 * cancels somebody else's subscription silently. None of that is visible to the
 * type system: both calls type-check with any id at all.
 */
const { actionCancelSubscriptionByEmail } = await import('./subscription.actions');

const LOOKUP_PATH = '/api/v1/auth/get-user-by-email';
const CANCEL_PATH = '/internal/subscriptions/cancel';

const EMAIL = 'member@example.com';

const FOUND = { status: 200, body: { id: 'user-1', email: EMAIL } };
const CANCELLED = { status: 200, body: { message: 'Operation success' } };

beforeEach(() => {
  resetKit();
});

describe('cancelSubscriptionByEmail', () => {
  it('resolves the address before it cancels, and cancels the user it resolved', async () => {
    const api = serveApi({ [LOOKUP_PATH]: FOUND, [CANCEL_PATH]: CANCELLED });

    const { serverError } = await actionCancelSubscriptionByEmail({ email: EMAIL });

    expect(serverError).toBeUndefined();
    expect(api.paths()).toEqual([LOOKUP_PATH, CANCEL_PATH]);
    expect(api.request(LOOKUP_PATH).method).toBe('POST');
    expect(await api.request(LOOKUP_PATH).json()).toEqual({ email: EMAIL });
    expect(api.request(CANCEL_PATH).method).toBe('POST');
    expect(await api.request(CANCEL_PATH).json()).toMatchObject({ id: 'user-1' });
  });

  it('names the screen as the source and sends no reason, because none was asked for', async () => {
    const api = serveApi({ [LOOKUP_PATH]: FOUND, [CANCEL_PATH]: CANCELLED });

    await actionCancelSubscriptionByEmail({ email: EMAIL });

    expect(await api.request(CANCEL_PATH).json()).toEqual({
      id: 'user-1',
      cancellationSource: 'public_cancellation',
    });
  });

  it('cancels nothing at all when the address belongs to no account', async () => {
    const api = serveApi({
      [LOOKUP_PATH]: { status: 404, body: refusal('USER_DOES_NOT_EXIST_ERROR', 'NOT_FOUND', 'User not found') },
    });

    const { serverError } = await actionCancelSubscriptionByEmail({ email: 'stranger@example.com' });

    expect(api.paths()).toEqual([LOOKUP_PATH]);
    expect(isAccountNotFoundActionError(serverError)).toBe(true);
  });

  /*
   * The other code the specification declares for the same condition. Both are
   * asserted because the screen accepts either, and a deployment answering with
   * the one nobody tested would fall through to the generic message.
   */
  it('reads an unknown address off the API’s code and not off its status', async () => {
    serveApi({
      [LOOKUP_PATH]: { status: 404, body: refusal('ENTITY_NOT_FOUND_ERROR', 'NOT_FOUND', 'Entity not found') },
    });

    const { serverError } = await actionCancelSubscriptionByEmail({ email: 'stranger@example.com' });

    expect(isAccountNotFoundActionError(serverError)).toBe(true);
    expect(serverError).toMatchObject({ data: { source: 'api' } });
  });

  it('reports a refusal by the payments service as that upstream’s, so the screen can tell it apart', async () => {
    serveApi({
      [LOOKUP_PATH]: FOUND,
      [CANCEL_PATH]: { status: 400, body: paymentsRefusal(400, 'User has no active subscription') },
    });

    const { serverError } = await actionCancelSubscriptionByEmail({ email: EMAIL });

    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(serverError).toMatchObject({ status: 400, data: { source: 'payments-api' } });
    // The screen must not mistake it for an unknown address: that upstream
    // publishes no codes, so there is none here to match the lookup's.
    expect(isAccountNotFoundActionError(serverError)).toBe(false);
  });

  it('answers with the default server error when the refusal is in neither envelope', async () => {
    serveApi({ [LOOKUP_PATH]: FOUND, [CANCEL_PATH]: { status: 502, body: '<html>Bad gateway</html>' } });

    const { serverError } = await actionCancelSubscriptionByEmail({ email: EMAIL });

    expect(serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
  });

  it('calls neither upstream when what arrived is not an address', async () => {
    const api = serveApi({});

    const { validationErrors } = await actionCancelSubscriptionByEmail({ email: 'not-an-address' });

    expect(validationErrors).toBeDefined();
    expect(api.paths()).toEqual([]);
  });

  it('needs no session, because the screen that calls it is public', async () => {
    const api = serveApi({ [LOOKUP_PATH]: FOUND, [CANCEL_PATH]: CANCELLED });

    const { serverError } = await actionCancelSubscriptionByEmail({ email: EMAIL });

    expect(serverError).toBeUndefined();
    expect(api.request(LOOKUP_PATH).headers.get('authorization')).toBeNull();
    expect(api.request(CANCEL_PATH).headers.get('cookie')).toBeNull();
  });
});
