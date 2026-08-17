import { getApi } from '@/libs/server/api';
import type { components } from '@/network/api/api';
import { apiServerClient } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

import type { ActivityRow, ActivityStatus } from './activity-row';

/*
 * Where the activity list's rows come from, and the whole of the seam between its
 * two sources.
 *
 * Location request rows come from the new API. Reverse lookup and sex offender
 * rows still come from the legacy merged endpoint, because the new API cannot
 * answer for them: its reverse lookup report carries no phone number, and the row
 * is titled by one; and its activity feed models two kinds, so a sex offender
 * report has no representation there at all. The record on the two-source list
 * states the conditions for deleting everything below marked as the legacy half.
 *
 * That is also why this module imports a frozen legacy client, which new code
 * otherwise may not do. It is a knowing exception for the one read the new API
 * cannot serve, not an oversight, and it is confined to this module so that
 * removing it later is a deletion rather than an untangling.
 */

type LocationRequest = components['schemas']['LocationRequestResponse'];

/** The legacy half — every declaration from here to the composer dies with it. */

/**
 * The two kinds the legacy source still answers for, and what each is called in
 * the list's own vocabulary. Its third kind, `Location`, is what the new API now
 * serves, so a row of that kind arriving from here is dropped rather than shown
 * twice.
 */
const LEGACY_KINDS = {
  ReverseLookup: 'REVERSE_LOOKUP_REPORT',
  SexOffenderSearchReport: 'SEX_OFFENDER_REPORT',
} as const;

type LegacyKind = keyof typeof LEGACY_KINDS;

const LEGACY_STATUSES = {
  located: 'LOCATED',
  rejected: 'REJECTED',
  pending: 'PENDING',
  ready: 'READY',
} as const satisfies Record<string, ActivityStatus>;

/**
 * As much of the legacy merged response as the two surviving kinds need. Stated
 * here rather than as a shared type: it describes a source being retired, and
 * nothing outside this module should be able to reach for it.
 */
type LegacyServiceRequest = {
  id: string;
  source_type: LegacyKind | 'Location';
  status: keyof typeof LEGACY_STATUSES;
  location?: { name?: string };
  phone?: string;
  status_updated_at: string;
};

const isLegacyKind = (request: LegacyServiceRequest): request is LegacyServiceRequest & { source_type: LegacyKind } =>
  request.source_type in LEGACY_KINDS;

const fromServiceRequest = (request: LegacyServiceRequest & { source_type: LegacyKind }): ActivityRow => ({
  id: request.id,
  kind: LEGACY_KINDS[request.source_type],
  status: LEGACY_STATUSES[request.status],
  /*
   * A reverse lookup row is titled by the number it was run on, a sex offender
   * row by the name it was searched for.
   */
  title: (request.source_type === 'SexOffenderSearchReport' ? request.location?.name : request.phone) ?? '',
  /*
   * No address: neither of these kinds resolves one. Both describe themselves
   * with a fixed line instead, which is the row's to write, not this mapping's.
   */
  updatedAt: request.status_updated_at,
});

const readServiceRequests = async () => {
  const api = await getApi();

  return api.get<LegacyServiceRequest[]>('/service_requests');
};

/** The end of the legacy half. */

/**
 * A Location request as a row. The API's own status vocabulary is the list's, so
 * only the shape is mapped: the flat captured fields become the row's address, and
 * the type discriminator decides which of the two names the request carries.
 */
const fromLocationRequest = (request: LocationRequest): ActivityRow => ({
  id: request.id,
  kind: request.type === 'FIND_BY_LINK' ? 'LOCATION_BY_LINK' : 'LOCATION_BY_NUMBER',
  status: request.status,
  title: (request.type === 'FIND_BY_LINK' ? request.linkName : request.phoneNumber) ?? '',
  address: request.resolvedAddress ?? undefined,
  updatedAt: request.updatedAt,
});

/**
 * The member's activity, in one list, most-recently-changed first.
 *
 * Both sources are read together and neither depends on the other's answer, so an
 * empty result from one leaves the other's rows exactly where they are. Each
 * source is already ordered by recency on its own; the sort is what makes the two
 * one list rather than one appended to the other.
 */
export const readActivityList = async (): Promise<ActivityRow[]> => {
  const [locationRequests, serviceRequests] = await Promise.all([
    apiServerClient['/api/v1/location-requests'].GET().then(unwrapApiResponse),
    readServiceRequests(),
  ]);

  return [
    ...locationRequests.map(fromLocationRequest),
    ...serviceRequests.filter(isLegacyKind).map(fromServiceRequest),
  ].sort((one, other) => Date.parse(other.updatedAt) - Date.parse(one.updatedAt));
};
