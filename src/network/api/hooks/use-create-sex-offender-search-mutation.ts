'use client';

import { $api } from '../api-browser-client';

/**
 * Runs a sex-offender registry search and stores the vendor's answer.
 *
 * Free — only unlocking a candidate is charged — so this is a write that moves no
 * money, and an ordinary query-library mutation: it sets no cookie, and the
 * navigation that follows it is the form's own `router.push`, not a redirect the
 * server performs.
 *
 * An empty candidate list is a success with nothing in it, and the screen after
 * this one draws its own empty result for that. A provider outage is a refusal,
 * and the form shows the generic error toast it always has.
 *
 * This replaces the legacy `POST /sex_offender_searches`. Per ADR 0039 the
 * identifier it answers with is the new API's, and every screen downstream of it
 * — the candidate list, the unlock, the record — reads that same upstream.
 */
export const useCreateSexOffenderSearchMutation = () => $api.useMutation('post', '/api/v1/sex-offender-searches');
