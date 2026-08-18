import { type components } from './paymentsApi';

/**
 * Island-local view of the payments service schemas.
 *
 * This is a copy of resumewise's `paymentsSchemas` alias, deliberately kept
 * independent of ignastrace's generated payments specification
 * (`src/network/payments-api/payments-api.d.ts`). Reconciling the two is a task
 * for the future payments-api integration, not this parking-lot copy — see
 * issue #62. Nothing here reaches the real payments client; the type is all the
 * checkout island needs.
 */
export type paymentsSchemas = components['schemas'];
