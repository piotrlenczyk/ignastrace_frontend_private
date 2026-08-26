'use client';

import { useEffect } from 'react';

import { deleteFunnelUpsellRecord } from '@/libs/funnel-upsell-record';

/**
 * Ends the funnel's record of what this run bought, once the screen that reports
 * it has rendered.
 *
 * A server component cannot delete a cookie during a render, so the deletion is
 * an effect on the confirmation screen, mounted after the purchase event: the
 * record is read on the server, reported, and then discarded, so one purchase is
 * reported once however many times the screen is reloaded and a later run
 * reports nothing an earlier one bought.
 *
 * It is deliberately not conditional on an event having been pushed. A record
 * that priced at nothing produces no event and must still not outlive the screen
 * that read it — otherwise the next run in the same session would add its own
 * purchases to it and report both.
 *
 * Only the two thank-you screens mount this. The order-success screen's own
 * extras are bought *after* its event fires, and the thank-you screen after it is
 * what reports them.
 *
 * See docs/adr/0037-the-funnel-s-purchase-events-report-what-was-bought.md.
 */
export const FunnelUpsellRecordEnd = () => {
  useEffect(() => {
    deleteFunnelUpsellRecord();
  }, []);

  return null;
};
