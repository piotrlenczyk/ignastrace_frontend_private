import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { beforeEach, describe, expect, it } from 'vitest';

import { isHttpClientActionError } from '@/server/lib/safe-action';
/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { redirect, REDIRECTED, refusal, resetKit, revalidatePath, serveApi, signedIn } from '@/test/server-write-kit';

import { LINK_NAME_MAX_CHARACTERS } from './location-request.schemas';

/*
 * Asking for a location by link, driven the way the naming form drives it: a name
 * in, a navigation out. What this seam is for is the three promises the screen
 * depends on and cannot see from inside itself — that the request the API is sent
 * is the one the specification declares, that the Consent link's token is not
 * what the member's browser is sent to, and that a refusal arrives carrying the
 * API's own code rather than as a generic failure.
 */
const { actionCreateLinkLocationRequest } = await import('./location-request.actions');

const CREATE_PATH = '/api/v1/location-requests';

/** The activity list, as a creation invalidates it: by segment, for every locale. */
const ACTIVITY_LIST_PATH = '/[locale]/memberarea/status';

const LINK_NAME = 'Find my sister';

const CONSENT_TOKEN = '6f1ed002ab5595859014ebf0951522d9515002f7f5c9';

const CREATED = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'FIND_BY_LINK',
  status: 'PENDING',
  shareLink: `https://app.example.com/l/${CONSENT_TOKEN}`,
};

const SUCCESS_SCREEN = `/memberarea/find-by-link/success?id=${CREATED.id}`;

const createLink = (linkName: string = LINK_NAME) => actionCreateLinkLocationRequest({ linkName });

/**
 * A successful creation ends in a navigation, and a navigation leaves an action by
 * throwing — so this is what "it worked" looks like from the outside.
 */
const expectNavigation = async (linkName?: string) => {
  await expect(createLink(linkName)).rejects.toThrow(REDIRECTED);
};

beforeEach(async () => {
  resetKit();
  await signedIn();
});

describe('createLinkLocationRequest', () => {
  it('creates a link-type request carrying the name the member typed', async () => {
    const api = serveApi({ [CREATE_PATH]: { status: 201, body: CREATED } });

    await expectNavigation();
    const upstream = api.request(CREATE_PATH);

    expect(api.paths()).toEqual([CREATE_PATH]);
    expect(upstream.method).toBe('POST');
    expect(await upstream.json()).toEqual({ type: 'FIND_BY_LINK', linkName: LINK_NAME });
  });

  it('sends the member on by the request’s own id, never by the consent link’s token', async () => {
    serveApi({ [CREATE_PATH]: { status: 201, body: CREATED } });

    await expectNavigation();

    expect(redirect).toHaveBeenCalledWith(SUCCESS_SCREEN);
    expect(SUCCESS_SCREEN).not.toContain(CONSENT_TOKEN);
  });

  it('invalidates the activity list the new request belongs in, before it navigates', async () => {
    serveApi({ [CREATE_PATH]: { status: 201, body: CREATED } });

    await expectNavigation();

    expect(revalidatePath).toHaveBeenCalledWith(ACTIVITY_LIST_PATH, 'page');
  });

  it('hands a refusal to the form as a structured action error, and goes nowhere', async () => {
    serveApi({
      [CREATE_PATH]: { status: 403, body: refusal('NOT_PERMITTED_ERROR', 'FORBIDDEN', 'Guest users cannot create') },
    });

    const { serverError } = await createLink();

    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(serverError).toMatchObject({ status: 403, data: { errorCode: 'NOT_PERMITTED_ERROR' } });
    expect(redirect).not.toHaveBeenCalled();
    // Signing this member in invalidated the root layout, so the list is what there is to check.
    expect(revalidatePath).not.toHaveBeenCalledWith(ACTIVITY_LIST_PATH, 'page');
  });

  it('answers with the default server error when the refusal is not one the API described', async () => {
    serveApi({ [CREATE_PATH]: { status: 502, body: '<html>Bad gateway</html>' } });

    const { serverError } = await createLink();

    expect(serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('refuses an unnamed link without calling the API', async () => {
    const api = serveApi({});

    const { validationErrors } = await createLink('');

    expect(validationErrors).toBeDefined();
    expect(api.paths()).toEqual([]);
  });

  it('refuses a name past the maximum without calling the API', async () => {
    const api = serveApi({});

    const { validationErrors } = await createLink('n'.repeat(LINK_NAME_MAX_CHARACTERS + 1));

    expect(validationErrors).toBeDefined();
    expect(api.paths()).toEqual([]);
  });
});
