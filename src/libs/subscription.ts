import type { Route } from 'next';
import { redirect } from 'next/navigation';

import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';
import { getSubscription } from '@/server/getters/subscription.getters';
import { getServerSession } from '@/server/session/session.utils';
import type { SubscriptionDetails } from '@/types/pricing.types';
import type { User } from '@/types/user';

import { composeMember } from './membership-mock';

/**
 * The signed-in member as a server render sees one: the account read from the
 * new API, stitched together with the membership facts no endpoint publishes yet.
 *
 * This is the server-side composer. Every screen that used to fetch the funnel's
 * aggregate calls it, so there is one place to rewrite when the commercial
 * endpoints exist — see the mock module, and the ADR it points at.
 */
export const getUser = async (): Promise<User> => {
  const account = await apiServerClient['/api/v1/user/me'].GET().then(unwrapApiResponse);

  return composeMember(account);
};

/**
 * The member, or `undefined` when the caller is an anonymous visitor.
 *
 * The session's own `isLoggedIn` flag decides, rather than the object: an empty
 * session is still an object, so testing truthiness would admit a visitor who
 * has none.
 *
 * A guest is an ordinary answer here, not a failure. The public funnel screens
 * run this on every render, and the member-area ones are already behind the
 * middleware's redirect and their own session check, so nothing downstream needs
 * `/user/me` to raise a 401 on their behalf.
 */
export const getSignedInUser = async (): Promise<User | undefined> => {
  const session = await getServerSession();

  return session?.isLoggedIn ? getUser() : undefined;
};

/**
 * Where the three states of a subscription send a member. A route left out means
 * "stay on this screen".
 */
export type SubscriptionRoutes = {
  /** No record at all, or one no payment ever succeeded against. */
  noSubscription?: Route;
  /** Has access: paying, inside a cancelled period, or still being retried. */
  activeSubscription?: Route;
  /** Ran out, and nobody is retrying it. */
  endedSubscription?: Route;
};

/** The gate's third answer, which is neither a subscription nor the absence of one. */
const UNREADABLE = Symbol('unreadable subscription');

/**
 * The member's subscription, `undefined` where the payments service holds none,
 * and `UNREADABLE` where it could not be asked at all.
 *
 * Three answers rather than two, because the gate acts differently on each and
 * the difference is the point of this module's fail-open branch: an absence is
 * an ordinary fact about a member, while a service that refuses or cannot be
 * reached is a fact about neither the member nor this application, and must not
 * move anybody.
 *
 * Both failures are caught here — the refusal the service answers with, and the
 * rejection a transport failure raises — because a member reading a screen is
 * ejected from it either way otherwise, and the difference between a 500 and an
 * unresolvable host is not one the member can act on.
 */
const readSubscription = async (): Promise<SubscriptionDetails | undefined | typeof UNREADABLE> => {
  try {
    const { data, error, response } = await getSubscription();

    if (data) {
      return data;
    }

    if (response.status === 404) {
      return undefined;
    }

    console.error(
      `The subscription gate could not read the payments service (${response.status}); nobody is moved.`,
      error,
    );
  } catch (failure) {
    console.error('The subscription gate could not reach the payments service; nobody is moved.', failure);
  }

  return UNREADABLE;
};

/**
 * The route this member's subscription state calls for, or `undefined` to stay
 * put. A guest always stays put — a screen that must not be seen by one guards
 * that itself.
 *
 * The answer comes from the payments service, which is the only upstream that
 * models a subscription, and through the same `hasAccess` rule the billing
 * screen branches on: one rule for access, one upstream that answers it. The
 * member's account is not read here at all — it has nothing to say about a
 * subscription — so a gated render costs one upstream call rather than two.
 *
 * Whether the caller is a member is settled from the session's own flag rather
 * than from anything the network says, and that is load-bearing: the payments
 * credential is seeded for any session the middleware can read, so a visitor
 * would otherwise be answered with the shared technical account's subscription
 * and redirected off the public screens.
 *
 * Only a 404 means "no subscription". Every other refusal — and a service that
 * cannot be reached at all — leaves the member exactly where they are and is
 * logged, which diverges on purpose from the billing screen's reading of the
 * same getter: that screen cannot render without the record, so absence and
 * outage are the same thing to it, while this one only needs to know whether it
 * is entitled to move somebody. Ejecting the paying population from the member
 * area on a foreign system's outage — or putting a payment button in front of
 * them — is the worse failure.
 *
 * See docs/adr/0036-the-subscription-gate-reads-the-payments-service.md.
 */
export const getSubscriptionRedirect = async (options: { routes: SubscriptionRoutes }): Promise<Route | undefined> => {
  const session = await getServerSession();

  if (!session?.isLoggedIn) {
    return undefined;
  }

  const subscription = await readSubscription();

  if (subscription === UNREADABLE) {
    return undefined;
  }

  if (!subscription || subscription.status === 'initial' || subscription.status === 'incomplete') {
    return options.routes.noSubscription;
  }

  if (subscription.hasAccess) {
    return options.routes.activeSubscription;
  }

  return options.routes.endedSubscription;
};

/**
 * The same decision, taken. Every public screen that a member has no business
 * seeing calls this at the top of its render.
 *
 * `endedSubscription` is required because the expired member has nowhere else to
 * be: leaving them on a marketing page with no way back to billing is never the
 * intent, and every call site already passes it.
 */
export const redirectIfAuthenticated = async (
  routes: SubscriptionRoutes & { endedSubscription: Route },
): Promise<void> => {
  const redirectUrl = await getSubscriptionRedirect({ routes });

  if (redirectUrl) {
    redirect(redirectUrl);
  }
};
