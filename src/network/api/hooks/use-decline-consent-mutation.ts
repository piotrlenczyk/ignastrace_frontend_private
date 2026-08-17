'use client';

import { $api } from '../api-browser-client';

/**
 * Answers a Consent link with a refusal.
 *
 * A mutation for the same reasons as [useGrantConsentMutation], and with no body
 * at all: a refusal carries no location, and the API deliberately never
 * distinguishes a refused link from an answered one when the link's state is read
 * back, so there is nothing else to say.
 */
export const useDeclineConsentMutation = () => $api.useMutation('post', '/api/v1/consent-links/{token}/decline');
