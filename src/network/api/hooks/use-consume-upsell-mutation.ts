'use client';

import { $api } from '../api-browser-client';

/**
 * Spends one of the caller's credits to unlock a paid section of a report.
 *
 * The new API spends the oldest unconsumed, unrefunded credit of that product and
 * fires the product's own side effect once the spend commits — the expanded social
 * search runs inline, a sex-offender fetch is dispatched — so a screen that has
 * spent a credit has also started the work behind it, and story by story that is
 * why the section fills in without a second action.
 *
 * `ownerId` is required for `SEX_OFFENDERS` and forbidden for every other product,
 * which is what makes an unlock apply to the report owner the member chose and not
 * to another.
 *
 * A mutation rather than a server action because a spend sets no cookie and causes
 * no navigation. It does change server-rendered output — the report's section
 * states are read in a server component — so the call site follows it with
 * `router.refresh()` and invalidates the credit balances, and nothing else.
 *
 * This replaces the legacy `POST /reverse_lookups_upsellings/consume`. Per ADR
 * 0030 the spend is the member's own call, on the member's own token, where the
 * purchase beside it is raised as the shared technical account.
 */
export const useConsumeUpsellMutation = () => $api.useMutation('post', '/api/v1/reverse-lookup-upsellings/consume');
