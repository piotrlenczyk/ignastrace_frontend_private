import { describe, expect, it } from 'vitest';

import { isReportLimitRefusal } from './report-creation-limit';

/** The envelope the API refuses in, carrying whichever code is under test. */
const envelope = (errorCode: string) => ({
  error: { message: 'Too many reports.', errorCode, code: 'TOO_MANY_REQUESTS', details: [] },
});

describe('recognising a spent report allowance', () => {
  it('recognises the code the dedicated enumeration carries', () => {
    expect(isReportLimitRefusal(envelope('TOO_MANY_REQUESTS'))).toBe(true);
  });

  it('recognises the code the shared business enumeration carries', () => {
    expect(isReportLimitRefusal(envelope('TOO_MANY_REQUESTS_ERROR'))).toBe(true);
  });

  it('leaves an unrelated refusal to the fallback', () => {
    expect(isReportLimitRefusal(envelope('VALIDATION_ERROR'))).toBe(false);
  });

  it('leaves a failure that carries no envelope at all to the fallback', () => {
    expect(isReportLimitRefusal(new Error('The gateway said nothing.'))).toBe(false);
    expect(isReportLimitRefusal(undefined)).toBe(false);
  });
});
