import { DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { beforeEach, describe, expect, it } from 'vitest';

import { isDispatchLimitActionError } from '@/server/lib/location-request-action-error';
import { isHttpClientActionError } from '@/server/lib/safe-action';
/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { redirect, REDIRECTED, refusal, resetKit, revalidatePath, serveApi, signedIn } from '@/test/server-write-kit';

import { LINK_NAME_MAX_CHARACTERS, MESSAGE_MAX_CHARACTERS } from './location-request.schemas';

/*
 * Asking for a location, both ways, driven the way each screen drives it: what the
 * member typed in, a navigation out. What this seam is for is the promises the
 * screens depend on and cannot see from inside themselves — that the requests the
 * API is sent are the ones the specification declares, that a dispatch is a second
 * call and only happens when a creation succeeded, that the Consent link's token is
 * not what the member's browser is sent to, and that a refusal arrives carrying the
 * API's own code rather than as a generic failure.
 */
const { actionCreateLinkLocationRequest, actionCreateNumberLocationRequest } =
  await import('./location-request.actions');

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

const PHONE_NUMBER = '+12025550123';

const MESSAGE = 'Can you share your location with me?';

const NUMBER_CREATED = { ...CREATED, type: 'FIND_BY_NUMBER' };

const DISPATCH_PATH = `${CREATE_PATH}/${NUMBER_CREATED.id}/send-sms`;

/** The compose screen, which renders the member's SMS dispatch counter server-side. */
const COMPOSE_SCREEN_PATH = '/[locale]/memberarea/find-by-number/message-sending';

const NUMBER_SUCCESS_SCREEN = '/memberarea/find-by-number/message-sending/success';

/** Both calls answered, which is the only way the pair reaches its navigation. */
const serveCreationAndDispatch = () =>
  serveApi({
    [CREATE_PATH]: { status: 201, body: NUMBER_CREATED },
    [DISPATCH_PATH]: { status: 200 },
  });

const createByNumber = (message: string = MESSAGE) =>
  actionCreateNumberLocationRequest({ phoneNumber: PHONE_NUMBER, message });

const expectNumberNavigation = async (message?: string) => {
  await expect(createByNumber(message)).rejects.toThrow(REDIRECTED);
};

describe('createNumberLocationRequest', () => {
  it('creates a number-type request, then dispatches its SMS, in that order', async () => {
    const api = serveCreationAndDispatch();

    await expectNumberNavigation();
    const creation = api.request(CREATE_PATH);
    const dispatch = api.request(DISPATCH_PATH);

    // The order is the assertion: the API never dispatches as a side effect of creating.
    expect(api.paths()).toEqual([CREATE_PATH, DISPATCH_PATH]);
    expect(creation.method).toBe('POST');
    expect(await creation.json()).toEqual({ type: 'FIND_BY_NUMBER', phoneNumber: PHONE_NUMBER, message: MESSAGE });
    expect(dispatch.method).toBe('POST');
    expect(redirect).toHaveBeenCalledWith(NUMBER_SUCCESS_SCREEN);
  });

  it('leaves the SMS undispatched when the creation is refused', async () => {
    const api = serveApi({
      [CREATE_PATH]: { status: 403, body: refusal('NOT_PERMITTED_ERROR', 'FORBIDDEN', 'Guest users cannot create') },
    });

    const { serverError } = await createByNumber();

    expect(api.paths()).toEqual([CREATE_PATH]);
    expect(isHttpClientActionError(serverError)).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('hands a refused dispatch to the form carrying the API’s dispatch-limit code', async () => {
    serveApi({
      [CREATE_PATH]: { status: 201, body: NUMBER_CREATED },
      [DISPATCH_PATH]: {
        status: 429,
        body: refusal('TOO_MANY_REQUESTS', 'TOO_MANY_REQUESTS', 'Dispatch budget spent'),
      },
    });

    const { serverError } = await createByNumber();

    expect(isDispatchLimitActionError(serverError)).toBe(true);
    expect(serverError).toMatchObject({ status: 429, data: { errorCode: 'TOO_MANY_REQUESTS' } });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('answers with the default server error when the refusal is not one the API described', async () => {
    serveApi({
      [CREATE_PATH]: { status: 201, body: NUMBER_CREATED },
      [DISPATCH_PATH]: { status: 502, body: '<html>Bad gateway</html>' },
    });

    const { serverError } = await createByNumber();

    expect(serverError).toBe(DEFAULT_SERVER_ERROR_MESSAGE);
    expect(isDispatchLimitActionError(serverError)).toBe(false);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('invalidates the activity list and the compose screen’s counter after a dispatch', async () => {
    serveCreationAndDispatch();

    await expectNumberNavigation();

    expect(revalidatePath).toHaveBeenCalledWith(ACTIVITY_LIST_PATH, 'page');
    expect(revalidatePath).toHaveBeenCalledWith(COMPOSE_SCREEN_PATH, 'page');
  });

  it('refuses an empty message without calling the API', async () => {
    const api = serveApi({});

    const { validationErrors } = await createByNumber('');

    expect(validationErrors).toBeDefined();
    expect(api.paths()).toEqual([]);
  });

  it('refuses a message past the maximum the running configuration allows', async () => {
    const api = serveApi({});

    const { validationErrors } = await createByNumber('m'.repeat(MESSAGE_MAX_CHARACTERS + 1));

    expect(validationErrors).toBeDefined();
    expect(api.paths()).toEqual([]);
  });
});
