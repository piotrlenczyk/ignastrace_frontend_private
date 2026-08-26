import { apiServerClient, type schemas } from '@/network/api/apiServerClient';
import { unwrapApiResponse } from '@/network/http-response-handler';

/**
 * The two server-side reads behind the standalone sex-offender search.
 *
 * A module of its own rather than two calls inside two page components, for the
 * reason the reverse-lookup getters beside it exist: it is the one place a
 * refusal on this family will be classified when one needs to be, and until then
 * it is the seam a test drives these reads through.
 *
 * **Nothing is classified today, and that is deliberate.** Both operations
 * declare 200, 401 and 403 only, and both document in prose that a search or a
 * report which is not the caller's answers 404 — the same status as one that does
 * not exist, so that an identifier cannot be probed for whether it belongs to
 * somebody. There is therefore nothing here that a screen could act on
 * differently, and every refusal throws and reaches the error boundary, exactly
 * as it did through the legacy server getter this replaces.
 */

/** A search a member ran, with the vendor's candidates derived from it. */
export type SexOffenderSearch = schemas['SexOffenderSearchResponse'];

/** The full record behind one candidate the member has unlocked. */
export type SexOffenderSearchReport = schemas['SexOffenderSearchReportResponse'];

/**
 * A search and its candidate list, re-derived from the stored vendor payload.
 *
 * An empty `matches` is an ordinary answer — the registry found nobody — and the
 * screen draws its own empty result for it rather than an error.
 */
export const getSexOffenderSearch = (searchId: string): Promise<SexOffenderSearch> =>
  apiServerClient['/api/v1/sex-offender-searches/{searchId}']
    .GET({ params: { path: { searchId } } })
    .then(unwrapApiResponse);

/**
 * One purchased record, addressed by the identifier the unlock answered with.
 *
 * The row existing is the entitlement: there is no flag on the response to read,
 * and a report the caller does not own is a refusal rather than a locked answer.
 */
export const getSexOffenderSearchReport = (searchReportId: string): Promise<SexOffenderSearchReport> =>
  apiServerClient['/api/v1/sex-offender-search-reports/{searchReportId}']
    .GET({ params: { path: { searchReportId } } })
    .then(unwrapApiResponse);
