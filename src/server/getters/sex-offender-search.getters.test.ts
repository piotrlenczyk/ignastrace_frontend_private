import { beforeEach, describe, expect, it } from 'vitest';

/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { refusal, resetKit, serveApi, signedIn } from '@/test/server-write-kit';

const { getSexOffenderSearch, getSexOffenderSearchReport } = await import('./sex-offender-search.getters');

/*
 * The two server-side reads behind the standalone sex-offender search: the
 * search a member ran, and the record they unlocked out of it.
 *
 * What the module promises is the same for both: it asks for its own generated
 * path and nothing else, and it hands back what the API stated unchanged.
 * Nothing is classified — both operations declare 200, 401 and 403 only, and the
 * 404 they document in prose for a search or a report that is not the caller's
 * throws, exactly as one that does not exist does. So the cases below are about
 * the path, the answer, and refusals reaching the caller rather than being read
 * as an absence.
 */

const SEARCH_ID = 'b1f2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const SEARCH_REPORT_ID = '7a6b5c4d-3e2f-4109-8a7b-6c5d4e3f2a1b';

const SEARCH_PATH = `/api/v1/sex-offender-searches/${SEARCH_ID}`;
const SEARCH_REPORT_PATH = `/api/v1/sex-offender-search-reports/${SEARCH_REPORT_ID}`;

const SEARCH = {
  id: SEARCH_ID,
  firstName: 'Mason',
  lastName: 'Hawthorne',
  city: null,
  state: null,
  zipCode: null,
  matches: [
    {
      candidateIndex: 0,
      firstName: 'Mason',
      lastName: 'Hawthorne',
      dateOfBirth: '1979-04-02',
      address: '14 Elm Street',
      city: 'Albany',
      state: 'NY',
      photoUrl: 'https://cdn.example.com/offenders/mason.jpg',
    },
  ],
};

const SEARCH_REPORT = {
  id: SEARCH_REPORT_ID,
  searchId: SEARCH_ID,
  candidateIndex: 0,
  purchasedAt: '2026-08-20T10:15:00.000Z',
  name: 'Mason Hawthorne',
  nickNames: [],
  heightCm: 180,
  weightKg: 80,
  isAbsconder: false,
  isPredator: false,
  photos: [],
};

/** A refusal in the API's envelope, at a status the transport really answers with. */
const refuse = (status: number, errorCode: string, code: string) => ({
  status,
  body: refusal(errorCode, code, 'Refused.'),
});

beforeEach(async () => {
  resetKit();
  await signedIn();
});

describe('getSexOffenderSearch', () => {
  it('asks for the search’s own path and nothing else', async () => {
    const api = serveApi({ [SEARCH_PATH]: { status: 200, body: SEARCH } });

    await getSexOffenderSearch(SEARCH_ID);

    expect(api.paths()).toEqual([SEARCH_PATH]);
  });

  it('hands back the search and its candidates as the API stated them', async () => {
    serveApi({ [SEARCH_PATH]: { status: 200, body: SEARCH } });

    expect(await getSexOffenderSearch(SEARCH_ID)).toEqual(SEARCH);
  });

  /* An empty candidate list is a normal answer, and the screen draws it. */
  it('hands back a search that found nobody rather than treating it as a failure', async () => {
    const empty = { ...SEARCH, matches: [] };

    serveApi({ [SEARCH_PATH]: { status: 200, body: empty } });

    expect(await getSexOffenderSearch(SEARCH_ID)).toEqual(empty);
  });

  /*
   * The status the API answers with for a search that is not the caller's, and
   * for one that does not exist. Neither is classified, so both reach the error
   * boundary the way the legacy read did.
   */
  it('rejects a search that is not the caller’s rather than answering with an absence', async () => {
    serveApi({ [SEARCH_PATH]: refuse(404, 'ENTITY_NOT_FOUND_ERROR', 'NOT_FOUND') });

    await expect(getSexOffenderSearch(SEARCH_ID)).rejects.toThrow();
  });

  it('rejects any other refusal', async () => {
    serveApi({ [SEARCH_PATH]: refuse(401, 'INVALID_TOKEN', 'UNAUTHORIZED') });

    await expect(getSexOffenderSearch(SEARCH_ID)).rejects.toThrow();
  });
});

describe('getSexOffenderSearchReport', () => {
  it('asks for the report’s own path and nothing else', async () => {
    const api = serveApi({ [SEARCH_REPORT_PATH]: { status: 200, body: SEARCH_REPORT } });

    await getSexOffenderSearchReport(SEARCH_REPORT_ID);

    expect(api.paths()).toEqual([SEARCH_REPORT_PATH]);
  });

  it('hands back the record as the API stated it', async () => {
    serveApi({ [SEARCH_REPORT_PATH]: { status: 200, body: SEARCH_REPORT } });

    expect(await getSexOffenderSearchReport(SEARCH_REPORT_ID)).toEqual(SEARCH_REPORT);
  });

  it('rejects a report that is not the caller’s rather than answering with an absence', async () => {
    serveApi({ [SEARCH_REPORT_PATH]: refuse(404, 'ENTITY_NOT_FOUND_ERROR', 'NOT_FOUND') });

    await expect(getSexOffenderSearchReport(SEARCH_REPORT_ID)).rejects.toThrow();
  });

  it('rejects a section the member has not unlocked rather than answering with an absence', async () => {
    serveApi({ [SEARCH_REPORT_PATH]: refuse(403, 'UPSELL_REQUIRED_ERROR', 'FORBIDDEN') });

    await expect(getSexOffenderSearchReport(SEARCH_REPORT_ID)).rejects.toThrow();
  });
});
