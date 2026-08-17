'use client';

import { $api } from '../api-browser-client';

/**
 * Answers a Consent link with the recipient's location.
 *
 * A mutation rather than a server action because granting sets no cookie, causes
 * no navigation and changes nothing this application renders on the server — the
 * sender's activity list is the backend's to update, and the recipient never sees
 * it. The call carries no credential: a recipient has no account, and the proxy
 * simply omits the header it has nothing to fill.
 *
 * All three fields of the body are required, and the address is resolved in the
 * browser because the backend never geocodes — so a grant without an address is
 * not representable, and a caller that cannot resolve one has nothing to send.
 */
export const useGrantConsentMutation = () => $api.useMutation('post', '/api/v1/consent-links/{token}/grant');
