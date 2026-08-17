import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { beforeEach, describe, expect, it } from 'vitest';

import { isEmailTakenActionError } from '@/server/lib/auth-action-error';
import { isHttpClientActionError } from '@/server/lib/safe-action';
/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import {
  IN_A_DAY,
  OK,
  redirect,
  refusal,
  resetKit,
  sealedSession,
  serveApi,
  signedIn,
  TOKEN_PAIR,
} from '@/test/server-write-kit';

/*
 * The account writes, driven the way the settings form drives them: an input in,
 * an action result out. What this seam is for is the promises a screen depends on
 * and cannot see from inside a mutation — that the password is verified before
 * anything is saved, that a refusal arrives carrying the API's own code, and that
 * a changed address reaches the sealed session.
 */
const { actionDeleteAccount, actionUpdateAccount } = await import('./account.actions');
const { getServerSession } = await import('../session/session.utils');

const PROFILE_PATH = '/api/v1/user';
const PASSWORD_PATH = '/api/v1/user/me/password';
const DELETE_PATH = '/api/v1/user/me/delete';

const PROFILE = { name: 'Jane Member', email: 'member@example.com' };

const PASSWORD_CHANGE = { currentPassword: 'OldPassword123!', newPassword: 'NewStrongPass123!' };

beforeEach(async () => {
  resetKit();
  await signedIn();
});

describe('updateAccount', () => {
  it('sends the profile to the update endpoint as the specification declares it', async () => {
    const api = serveApi({ [PROFILE_PATH]: OK });

    const { serverError } = await actionUpdateAccount(PROFILE);
    const upstream = api.request(PROFILE_PATH);

    expect(serverError).toBeUndefined();
    expect(upstream.method).toBe('PUT');
    expect(await upstream.json()).toEqual({ name: 'Jane Member', email: 'member@example.com' });
  });

  it('leaves the password endpoint alone when the member changed no password', async () => {
    const api = serveApi({ [PROFILE_PATH]: OK });

    await actionUpdateAccount(PROFILE);

    expect(api.paths()).toEqual([PROFILE_PATH]);
  });

  it('verifies the current password before it saves anything', async () => {
    const api = serveApi({ [PASSWORD_PATH]: OK, [PROFILE_PATH]: OK });

    await actionUpdateAccount({ ...PROFILE, ...PASSWORD_CHANGE });

    expect(api.paths()).toEqual([PASSWORD_PATH, PROFILE_PATH]);
    expect(await api.request(PASSWORD_PATH).json()).toEqual({
      oldPassword: 'OldPassword123!',
      newPassword: 'NewStrongPass123!',
    });
  });

  it('saves nothing at all when the current password is refused', async () => {
    const api = serveApi({
      [PASSWORD_PATH]: { status: 401, body: refusal('CREDENTIALS_ERROR', 'UNAUTHORIZED', 'Invalid credentials') },
    });

    const { serverError } = await actionUpdateAccount({ ...PROFILE, email: 'renamed@example.com', ...PASSWORD_CHANGE });

    expect(serverError).toMatchObject({ status: 401, data: { errorCode: 'CREDENTIALS_ERROR' } });
    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(api.paths()).toEqual([PASSWORD_PATH]);
    expect((await sealedSession()).user.email).toBe('member@example.com');
  });

  it('reports a failure when the password changed but the profile update was refused', async () => {
    serveApi({
      [PASSWORD_PATH]: OK,
      [PROFILE_PATH]: { status: 409, body: refusal('EMAIL_EXISTS_ERROR', 'CONFLICT', 'Email already exists') },
    });

    const { serverError, data } = await actionUpdateAccount({
      ...PROFILE,
      email: 'taken@example.com',
      ...PASSWORD_CHANGE,
    });

    expect(data).toBeUndefined();
    expect(isEmailTakenActionError(serverError)).toBe(true);
    expect((await sealedSession()).user.email).toBe('member@example.com');
  });

  it('points a taken address at the form by carrying the API’s conflict code', async () => {
    serveApi({
      [PROFILE_PATH]: { status: 409, body: refusal('USER_EXISTS_ERROR', 'CONFLICT', 'User already exists') },
    });

    const { serverError } = await actionUpdateAccount({ ...PROFILE, email: 'taken@example.com' });

    expect(isEmailTakenActionError(serverError)).toBe(true);
  });

  it('rewrites the session’s address on success, leaving the token pair as it was', async () => {
    serveApi({ [PROFILE_PATH]: OK });

    await actionUpdateAccount({ ...PROFILE, email: 'renamed@example.com' });

    expect(await sealedSession()).toEqual({
      isLoggedIn: true,
      accessToken: TOKEN_PAIR.token,
      accessTokenExpiresAt: IN_A_DAY * 1000,
      refreshToken: 'refresh-1',
      user: { id: 'user-1', email: 'renamed@example.com', type: 'USER', roles: ['STANDARD_USER'] },
    });
  });

  it('leaves a guest’s refusal for the generic message rather than attributing it to a field', async () => {
    serveApi({
      [PROFILE_PATH]: { status: 403, body: refusal('NOT_PERMITTED_ERROR', 'FORBIDDEN', 'Guest users cannot update') },
    });

    const { serverError } = await actionUpdateAccount(PROFILE);

    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(isEmailTakenActionError(serverError)).toBe(false);
    expect(serverError).toMatchObject({ status: 403, data: { errorCode: 'NOT_PERMITTED_ERROR' } });
  });

  it('answers with the default server error when the refusal is not one the API described', async () => {
    serveApi({ [PROFILE_PATH]: { status: 502, body: '<html>Bad gateway</html>' } });

    const { serverError } = await actionUpdateAccount(PROFILE);

    expect(serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
  });

  it('refuses a half-stated password change without calling the API', async () => {
    const api = serveApi({});

    const { validationErrors } = await actionUpdateAccount({ ...PROFILE, newPassword: 'NewStrongPass123!' });

    expect(validationErrors).toBeDefined();
    expect(api.paths()).toEqual([]);
  });
});

describe('deleteAccount', () => {
  it('deletes the account and destroys the session, without sending the member anywhere', async () => {
    const api = serveApi({ [DELETE_PATH]: { status: 200, body: { status: 'ok' } } });

    const { serverError } = await actionDeleteAccount();

    expect(serverError).toBeUndefined();
    expect(api.paths()).toEqual([DELETE_PATH]);
    expect(api.request(DELETE_PATH).method).toBe('DELETE');
    expect(await getServerSession()).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('keeps the session when the API refuses, so nothing is lost on a failed attempt', async () => {
    serveApi({
      [DELETE_PATH]: { status: 403, body: refusal('NOT_PERMITTED_ERROR', 'FORBIDDEN', 'Guest users cannot delete') },
    });

    const { serverError } = await actionDeleteAccount();

    expect(serverError).toMatchObject({ status: 403, data: { errorCode: 'NOT_PERMITTED_ERROR' } });
    expect(await getServerSession()).not.toBeNull();
  });
});
