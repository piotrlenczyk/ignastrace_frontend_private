'use server';

import { cookies } from 'next/headers';

import { REVERSE_LOOKUP_OVERRIDE_COOKIE_NAME } from '@/constants/features';
import type { Features } from '@/types/features';

import { getApi } from './api';

// This is meant to be called on the server side only. For client side, use the useFeatures hook.
// As Next.js overrides fetch to include request caching, we don't need to implement cache here
export async function getFeatures() {
  const api = await getApi();
  const features = await api.get<Features>('/features');

  // Apply cookie override for ENABLE_REVERSE_LOOKUP if set to true
  const cookieStore = await cookies();
  const reverseLookupOverride = cookieStore.get(REVERSE_LOOKUP_OVERRIDE_COOKIE_NAME);

  if (reverseLookupOverride?.value === 'true') {
    return {
      ...features,
      ENABLE_REVERSE_LOOKUP: true,
    };
  }

  return features;
}
