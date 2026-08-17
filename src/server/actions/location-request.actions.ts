'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { actionClient } from '@/server/lib/safe-action';

import { createLinkLocationRequestSchema, createNumberLocationRequestSchema } from './location-request.schemas';

/*
 * The Location request writes, as server actions on the one action client.
 *
 * They are actions rather than query-library mutations because creating a
 * Location request changes server-rendered output — the member's activity list —
 * and because what follows a creation is a navigation. Neither is something a
 * mutation in the browser can do. A refusal from the API propagates and the
 * action client shapes it into a structured action error carrying the API's own
 * envelope, so a form branches on the API's error code and never on a status.
 */

/*
 * The activity list is server-rendered and every new Location request belongs in
 * it, so a creation has to invalidate it — otherwise the member arrives at a list
 * that is missing the thing they just made.
 *
 * The path is stated with the `[locale]` segment and in the page scope on
 * purpose: the list lives under a dynamic segment, and naming the segment rather
 * than one locale's rendering of it invalidates the page for every locale.
 */
const revalidateActivityList = () => revalidatePath(`/[locale]${ROUTES.MEMBER.STATUS.HOME}`, 'page');

/*
 * The compose screen renders the member's SMS dispatch counter and its limit
 * server-side, so a dispatch makes that screen's own output stale as well as the
 * activity list's. Stated by segment and in page scope, for the same reason.
 */
const revalidateComposeScreen = () =>
  revalidatePath(`/[locale]${ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING}`, 'page');

/**
 * Creates a shareable Location request and sends the member to the screen that
 * shows its Share link.
 *
 * The creation response carries the Share link itself, and it is deliberately not
 * passed on: the link embeds the Consent link's opaque token, and a token in a
 * query string is written into the browser's history and into anything reading a
 * referrer. What travels is the request's own id, and the success screen reads the
 * link server-side from that.
 *
 * The navigation is the action's, which is why there is nothing to return. A
 * refusal never reaches it — the API call throws and the form is handed the
 * refusal instead.
 */
export const actionCreateLinkLocationRequest = actionClient
  .inputSchema(createLinkLocationRequestSchema)
  .action(async ({ parsedInput: { linkName } }) => {
    const { id } = await apiServerClient['/api/v1/location-requests']
      .POST({ body: { type: 'FIND_BY_LINK', linkName } })
      .then(unwrapApiResponse);

    revalidateActivityList();

    redirect(`${ROUTES.MEMBER.FIND_BY_LINK.SUCCESS}?id=${id}`);
  });

/**
 * Creates a Location request addressed to a phone number, dispatches its SMS, and
 * sends the member to the screen that says it is on its way.
 *
 * Two calls, in this order, because the API never dispatches as a side effect of
 * creating — dispatch is always a second, explicit call. One action performs both so
 * that the order is guaranteed somewhere the screen cannot get it wrong, and so a
 * refusal from either arrives at the form the same way.
 *
 * A refused dispatch leaves the created request exactly where it is, and a further
 * attempt creates a new one. That is today's behaviour, kept deliberately: the API
 * would allow retrying the dispatch alone against the existing request, and offering
 * that is a change to what this screen does rather than to what it talks to.
 *
 * Both things a dispatch changes are server-rendered — the activity list and this
 * funnel's own dispatch counter — which is what makes this an action rather than a
 * mutation in the browser.
 */
export const actionCreateNumberLocationRequest = actionClient
  .inputSchema(createNumberLocationRequestSchema)
  .action(async ({ parsedInput: { phoneNumber, message } }) => {
    const { id } = await apiServerClient['/api/v1/location-requests']
      .POST({ body: { type: 'FIND_BY_NUMBER', phoneNumber, message } })
      .then(unwrapApiResponse);

    await apiServerClient['/api/v1/location-requests/{id}/send-sms']
      .POST({ params: { path: { id } } })
      .then(unwrapApiResponse);

    revalidateActivityList();
    revalidateComposeScreen();

    redirect(ROUTES.MEMBER.FIND_BY_NUMBER.SUCCESS);
  });
