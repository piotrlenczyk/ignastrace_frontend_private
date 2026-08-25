import { beforeEach, describe, expect, it } from 'vitest';

/*
 * The kit installs the substitutions on import, so it comes before the module
 * under test — which is pulled in with `await import(...)` below for the same
 * reason.
 */
import { refusal, resetKit, serveApi, signedIn } from '@/test/server-write-kit';

const { getDataBreachDetail, getSectionedReport, getSexOffenderDetail } = await import('./reverse-lookup.getters');

/*
 * The three server-side reads behind a member's reverse-lookup report.
 *
 * What the module promises its callers is the same in all three cases: it asks
 * for its own generated path and nothing else, it hands back what the API stated
 * unchanged, and the two refusals a screen acts on arrive as outcomes rather than
 * as exceptions — a report still being prepared, and a section the member has not
 * unlocked. Everything else still rejects, because a screen must never be able to
 * read "the API said no" as "there is nothing here".
 */

const REPORT_ID = '3f9a1c22-9a1d-4d0e-8f6a-2c6d9a1b4e77';
const OWNER_ID = '0b8e1f44-2c31-4b7a-9d55-77a3f0e1c9aa';

const SECTIONS_PATH = `/api/v1/reverse-lookup-reports/${REPORT_ID}/sections`;
const DATA_BREACH_PATH = `/api/v1/reverse-lookup-reports/${REPORT_ID}/data-breach`;
const SEX_OFFENDER_PATH = `/api/v1/reverse-lookup-reports/${REPORT_ID}/owners/${OWNER_ID}/sex-offender`;

const SECTIONED_REPORT = {
  reportStatus: 'COMPLETED',
  photos: ['https://cdn.example.com/reports/abc/photo-1.jpg'],
  profile: {
    phone: '+12025550123',
    phoneFormats: { international: '+1 202-555-0123', local: '(202) 555-0123' },
    lineType: 'MOBILE',
    carrier: 'AT&T',
    country: 'US',
  },
  owners: [],
  socialMedia: { state: 'NO_RESULTS' },
  dataBreach: { state: 'RESULTS', matchCount: 2 },
  sexOffenders: { state: 'RESULTS', ownersWithRecords: [{ ownerId: OWNER_ID, found: true }] },
};

const DATA_BREACH_DETAIL = {
  phone: '+12025550123',
  photoUrl: null,
  dataLeaks: [
    {
      id: 'leak-1',
      serviceName: 'Example Forum',
      compromisedData: ['EMAIL', 'DATE_OF_BIRTH'],
      date: '2021-04-02T00:00:00.000Z',
      description: 'A forum breach.',
    },
  ],
};

const SEX_OFFENDER_DETAIL = {
  status: 'READY',
  isEmptyRecord: false,
  firstName: 'John',
  lastName: 'Doe',
  heightCm: 180,
  weightKg: 80,
};

/** A refusal in the API's envelope, at a status the transport really answers with. */
const refuse = (status: number, errorCode: string) => ({
  status,
  body: refusal(errorCode, status === 403 ? 'FORBIDDEN' : 'CONFLICT', 'Refused.'),
});

beforeEach(async () => {
  resetKit();
  await signedIn();
});

describe('getSectionedReport', () => {
  it('asks for the report’s own sectioned path and nothing else', async () => {
    const api = serveApi({ [SECTIONS_PATH]: { status: 200, body: SECTIONED_REPORT } });

    await getSectionedReport(REPORT_ID);

    expect(api.paths()).toEqual([SECTIONS_PATH]);
  });

  it('hands back the sections as the API stated them', async () => {
    serveApi({ [SECTIONS_PATH]: { status: 200, body: SECTIONED_REPORT } });

    expect(await getSectionedReport(REPORT_ID)).toEqual({ outcome: 'ready', data: SECTIONED_REPORT });
  });

  it('answers a report that is still being prepared with the in-preparation outcome', async () => {
    serveApi({ [SECTIONS_PATH]: refuse(409, 'ENTITY_CREATION_ERROR') });

    expect(await getSectionedReport(REPORT_ID)).toEqual({ outcome: 'in-preparation' });
  });

  it('reads a failed report as a report that completed with nothing in it', async () => {
    const failed = { ...SECTIONED_REPORT, reportStatus: 'FAILED', owners: [], photos: [] };

    serveApi({ [SECTIONS_PATH]: { status: 200, body: failed } });

    expect(await getSectionedReport(REPORT_ID)).toEqual({ outcome: 'ready', data: failed });
  });

  it('rejects any other refusal rather than reading it as an empty report', async () => {
    serveApi({ [SECTIONS_PATH]: refuse(403, 'INSUFFICIENT_PERMISSIONS') });

    await expect(getSectionedReport(REPORT_ID)).rejects.toThrow();
  });
});

describe('getDataBreachDetail', () => {
  it('asks for the report’s own data-breach path and nothing else', async () => {
    const api = serveApi({ [DATA_BREACH_PATH]: { status: 200, body: DATA_BREACH_DETAIL } });

    await getDataBreachDetail(REPORT_ID);

    expect(api.paths()).toEqual([DATA_BREACH_PATH]);
  });

  it('hands back the phone, the photo and every breach as the API stated them', async () => {
    serveApi({ [DATA_BREACH_PATH]: { status: 200, body: DATA_BREACH_DETAIL } });

    expect(await getDataBreachDetail(REPORT_ID)).toEqual({ outcome: 'ready', data: DATA_BREACH_DETAIL });
  });

  it.each(['UPSELL_REQUIRED_ERROR', 'NOT_PERMITTED_ERROR', 'INSUFFICIENT_PERMISSIONS'])(
    'answers a section the member has not unlocked with the not-unlocked outcome (%s)',
    async (errorCode) => {
      serveApi({ [DATA_BREACH_PATH]: refuse(403, errorCode) });

      expect(await getDataBreachDetail(REPORT_ID)).toEqual({ outcome: 'not-unlocked' });
    },
  );

  it('rejects any other refusal rather than reading it as a locked section', async () => {
    serveApi({
      [DATA_BREACH_PATH]: { status: 401, body: refusal('UNAUTHORIZED', 'UNAUTHORIZED', 'Unauthorized') },
    });

    await expect(getDataBreachDetail(REPORT_ID)).rejects.toThrow();
  });
});

describe('getSexOffenderDetail', () => {
  it('asks for the record’s own path, keyed by report and owner, and nothing else', async () => {
    const api = serveApi({ [SEX_OFFENDER_PATH]: { status: 200, body: SEX_OFFENDER_DETAIL } });

    await getSexOffenderDetail(REPORT_ID, OWNER_ID);

    expect(api.paths()).toEqual([SEX_OFFENDER_PATH]);
  });

  it('hands back the record as the API stated it', async () => {
    serveApi({ [SEX_OFFENDER_PATH]: { status: 200, body: SEX_OFFENDER_DETAIL } });

    expect(await getSexOffenderDetail(REPORT_ID, OWNER_ID)).toEqual({ outcome: 'ready', data: SEX_OFFENDER_DETAIL });
  });

  it('answers a record still being fetched with the same in-preparation outcome as a report', async () => {
    serveApi({ [SEX_OFFENDER_PATH]: { status: 200, body: { status: 'PENDING' } } });

    expect(await getSexOffenderDetail(REPORT_ID, OWNER_ID)).toEqual({ outcome: 'in-preparation' });
  });

  it('answers a record the member has not unlocked with the not-unlocked outcome', async () => {
    serveApi({ [SEX_OFFENDER_PATH]: refuse(403, 'UPSELL_REQUIRED_ERROR') });

    expect(await getSexOffenderDetail(REPORT_ID, OWNER_ID)).toEqual({ outcome: 'not-unlocked' });
  });

  it('rejects any other refusal rather than reading it as a locked record', async () => {
    serveApi({
      [SEX_OFFENDER_PATH]: { status: 401, body: refusal('UNAUTHORIZED', 'UNAUTHORIZED', 'Unauthorized') },
    });

    await expect(getSexOffenderDetail(REPORT_ID, OWNER_ID)).rejects.toThrow();
  });
});
