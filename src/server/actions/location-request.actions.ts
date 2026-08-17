'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/constants/routes';
import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { actionClient } from '@/server/lib/safe-action';

import { createLinkLocationRequestSchema } from './location-request.schemas';

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
