import { apiServerClient, type schemas } from '@/network/api/apiServerClient';
import { HttpClientError } from '@/network/http-client-error';
import { unwrapApiResponse } from '@/network/http-response-handler';

/** A member's report, split into the sections the API gates independently. */
export type SectionedReport = schemas['SectionedReportResponse'];

/** Everything the data-breach screen renders: the phone, one photo, the breaches. */
export type DataBreachDetail = schemas['DataBreachDetailResponse'];

/** One owner's sex-offender record, as the registry-facing endpoint states it. */
export type SexOffenderDetail = schemas['SexOffenderDetailResponse'];

/** A read that arrived, carrying what the API stated and nothing else. */
type Ready<Data> = { outcome: 'ready'; data: Data };

/**
 * The report is not finished yet.
 *
 * The two endpoints that can say so say it differently — the sectioned read
 * refuses, the sex-offender read answers 200 with a pending status — and both
 * collapse here, because the screens render one thing for it.
 */
type InPreparation = { outcome: 'in-preparation' };

/** The member has not spent an upselling against this section of this report. */
type NotUnlocked = { outcome: 'not-unlocked' };

/**
 * The status the sectioned operation's prose says it refuses with while the
 * report is still `PENDING` or `PROCESSING`.
 *
 * This is the one place in this module that reads a status rather than the API's
 * own error code, and it reads one because there is nothing else to read: the
 * operation declares 200, 401 and 403 only, so the refusal has no declared code,
 * and the generated `ConflictErrorCode` carries exactly one member —
 * `USER_EXISTS_ERROR` — which is about registration and not about a report. There
 * is therefore no constant to type against an enumeration, which is what the
 * report allowance's twin refusal had two of. The fix upstream is the operation
 * declaring the refusal with the code it really sends; until then a screen still
 * never sees a status, because it is classified here and once.
 */
const IN_PREPARATION_STATUS = 409;

/*
 * What a 403 on either detail endpoint means: the member has not unlocked this
 * section of this report.
 *
 * Three codes, each typed against the generated enumeration it comes from, so a
 * rename upstream fails the build rather than dropping a member who simply has
 * not bought a section onto an error page. Both operations document exactly one
 * 403 — "the upsell is absent" — but the declared `ForbiddenErrorCode` does not
 * carry a word for an upselling, and the shared business enumeration does; which
 * of them arrives is not established here, and accepting all three is what makes
 * establishing it unnecessary.
 *
 * `USER_IS_NOT_ACTIVE` and `BE_INTERNAL_SERVER_ERROR` are deliberately left out.
 * They are the two other things a 403 can carry and neither is about the section,
 * so both keep rejecting.
 */
const UPSELL_REQUIRED: schemas['BusinessErrorCode'] = 'UPSELL_REQUIRED_ERROR';
const NOT_PERMITTED: schemas['ForbiddenErrorCode'] = 'NOT_PERMITTED_ERROR';
const INSUFFICIENT_PERMISSIONS: schemas['ForbiddenErrorCode'] = 'INSUFFICIENT_PERMISSIONS';

const NOT_UNLOCKED_CODES: readonly string[] = [UPSELL_REQUIRED, NOT_PERMITTED, INSUFFICIENT_PERMISSIONS];

const isNotUnlocked = (failure: unknown) =>
  failure instanceof HttpClientError &&
  failure.data.errorCode !== undefined &&
  NOT_UNLOCKED_CODES.includes(failure.data.errorCode);

const isInPreparation = (failure: unknown) =>
  failure instanceof HttpClientError && failure.response.status === IN_PREPARATION_STATUS;

const ready = <Data>(data: Data): Ready<Data> => ({ outcome: 'ready', data });

const IN_PREPARATION: InPreparation = { outcome: 'in-preparation' };
const NOT_UNLOCKED: NotUnlocked = { outcome: 'not-unlocked' };

/**
 * The member's report as independently-gated sections — the one read behind the
 * report screen.
 *
 * The metadata endpoint beside it is deliberately not called: every field the
 * screens render is in this response's `profile` block, and nothing reads a
 * report's progress, so a second sequential round trip on every report open would
 * answer a question nobody asks. A `FAILED` report is not a failure here — it
 * arrives as a 200 whose sections are empty, and the screen already draws an empty
 * report.
 */
export const getSectionedReport = async (reportId: string): Promise<Ready<SectionedReport> | InPreparation> => {
  try {
    return ready(
      await apiServerClient['/api/v1/reverse-lookup-reports/{reportId}/sections']
        .GET({ params: { path: { reportId } } })
        .then(unwrapApiResponse),
    );
  } catch (failure) {
    if (isInPreparation(failure)) {
      return IN_PREPARATION;
    }

    throw failure;
  }
};

/**
 * Every data breach the report's phone number turned up, with the phone and the
 * report's first photo the screen draws its header from.
 *
 * One call where the screen used to make two: this endpoint is its own gate, so
 * the report read that existed only to supply one boolean has no reason to happen.
 */
export const getDataBreachDetail = async (reportId: string): Promise<Ready<DataBreachDetail> | NotUnlocked> => {
  try {
    return ready(
      await apiServerClient['/api/v1/reverse-lookup-reports/{reportId}/data-breach']
        .GET({ params: { path: { reportId } } })
        .then(unwrapApiResponse),
    );
  } catch (failure) {
    if (isNotUnlocked(failure)) {
      return NOT_UNLOCKED;
    }

    throw failure;
  }
};

/**
 * One owner's sex-offender record, keyed by the report and the owner it belongs
 * to rather than by a record identifier — the new API publishes none, and this is
 * the key the sectioned response's `ownersWithRecords` hands the screen.
 *
 * A record whose asynchronous fetch has not landed arrives as a 200 with a pending
 * status rather than as a refusal, and is answered with the outcome the report's
 * own "not finished yet" produces, so that one presentation covers both.
 */
export const getSexOffenderDetail = async (
  reportId: string,
  ownerId: string,
): Promise<Ready<SexOffenderDetail> | InPreparation | NotUnlocked> => {
  try {
    const record = await apiServerClient['/api/v1/reverse-lookup-reports/{reportId}/owners/{ownerId}/sex-offender']
      .GET({ params: { path: { reportId, ownerId } } })
      .then(unwrapApiResponse);

    return record.status === 'PENDING' ? IN_PREPARATION : ready(record);
  } catch (failure) {
    if (isNotUnlocked(failure)) {
      return NOT_UNLOCKED;
    }

    throw failure;
  }
};
