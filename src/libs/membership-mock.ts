import type { components } from '@/network/api/api';
import type { Upselling, User } from '@/types/user';

/*
 * The commercial half of a member, mocked — a scaffold, not a design. See
 * docs/adr/0013-a-mocked-membership-until-the-api-publishes-one.md for why it
 * exists, and for what has to be true before it is deleted.
 *
 * The account service answers with the account: who someone is, what they are
 * called, which language they read. It answers almost nothing about the commercial
 * relationship — whether a subscription was ever bought, what was paid for it,
 * which upsells are owned. The screens that gate on those facts predate the new
 * API and still need them, so they come from here until an endpoint publishes
 * them.
 *
 * One field has already left on those terms: the count of unread notifications,
 * which the new API's notification centre now answers for. That is the exit this
 * mock is supposed to have, taken a field at a time.
 *
 * Almost, because there is one exception, and the type below carves it out:
 * whether unlimited PDF downloads have been unlocked is a fact the account
 * service does hold, so it is read rather than invented.
 *
 * Two payloads sit side by side because the two worlds behave differently on
 * every gated screen, and a developer has to be able to walk both. `ACTIVE_MEMBERSHIP`
 * names the one in force; changing that one line moves the whole application
 * between them.
 */

/**
 * Everything the new API does not publish, and nothing it does. Typed as the
 * member shape minus every field the account service owns, so the type checker
 * refuses a mock that claims one — a fabricated email address, or a fabricated
 * entitlement, would hide exactly the integration failure this work exists to
 * expose.
 *
 * The two subtractions inside the commercial half are both the same fact: whether
 * unlimited PDF downloads are unlocked. The member shape records it twice, once
 * in the list of extras owned and once as a flag the report screens read, and
 * both are filled from the account's own answer below.
 */
export type MockMembership = Omit<User, 'id' | 'email' | 'locale' | 'upsellings' | 'purchase_info'> & {
  upsellings: Exclude<Upselling, 'unlimited_pdf_downloads'>[];
  purchase_info: Omit<NonNullable<User['purchase_info']>, 'unlimited_downloads_upsell_available'>;
};

/** A member who has bought a subscription and the extras the funnel offers alongside it. */
export const SUBSCRIBED_MEMBERSHIP: MockMembership = {
  notify_status_changes: true,
  notify_user_located: true,
  subscription_status: 'active',
  upsellings: ['sex_offenders', 'data_leaks'],
  currency: 'usd',
  /*
   * `…_upsell_available` reads as "the member has this to spend", not "this is
   * still for sale" — the report screens unlock on it and offer the upsell dialog
   * when it is false. A member who owns the extras therefore has both set.
   */
  purchase_info: {
    trial_price: 199,
    total_price: 3499,
    upsellings_price: 2997,
    data_leaks_upsell_available: true,
    sex_offenders_upsell_available: true,
  },
  onboarding_phone_number: '+12025550143',
};

/**
 * A member who has never paid. Every subscription gate sends this one away, which
 * is the path that has no other way of being reached while the backend cannot
 * answer the question.
 */
export const UNSUBSCRIBED_MEMBERSHIP: MockMembership = {
  notify_status_changes: false,
  notify_user_located: false,
  subscription_status: 'initial',
  upsellings: [],
  currency: 'usd',
  purchase_info: {
    trial_price: 199,
    total_price: 0,
    upsellings_price: 0,
    data_leaks_upsell_available: false,
    sex_offenders_upsell_available: false,
  },
  onboarding_phone_number: '+12025550143',
};

/** The switch. One line, one edit, both worlds. */
export const ACTIVE_MEMBERSHIP: MockMembership = SUBSCRIBED_MEMBERSHIP;

/**
 * The real account stitched together with the mocked membership, in the shape
 * every consuming screen already reads.
 *
 * One composer ends here — the server one, in the subscription policy module — so
 * the seam between what is real and what is invented is a single function. When
 * the endpoints arrive, this is what stops merging and starts reading them.
 *
 * There was a browser-side twin beside it, and it went with the last field a page
 * script asked it for: the unread notification count, which the notification
 * centre now answers directly. A client component that needs the account itself
 * reads the account query; nothing in the browser needs the mock any more.
 */
export const composeMember = (account: components['schemas']['UserResponse']): User => {
  const ownsUnlimitedDownloads = account.unlimitedPdfDownloadsUnlocked;

  return {
    ...ACTIVE_MEMBERSHIP,
    id: account.id,
    email: account.email ?? '',
    locale: account.language ?? 'en',
    /*
     * The one commercial fact the account service does answer, written into both
     * the places the member shape records it — the list of extras owned and the
     * flag the report screens unlock on. Filling both from the same answer is
     * what stops the gate and the screen it admits someone to disagreeing.
     */
    upsellings: ownsUnlimitedDownloads
      ? [...ACTIVE_MEMBERSHIP.upsellings, 'unlimited_pdf_downloads']
      : [...ACTIVE_MEMBERSHIP.upsellings],
    purchase_info: {
      ...ACTIVE_MEMBERSHIP.purchase_info,
      unlimited_downloads_upsell_available: ownsUnlimitedDownloads,
    },
  };
};
