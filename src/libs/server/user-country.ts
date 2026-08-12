import type { CountryCode } from 'libphonenumber-js';
import { cookies, headers } from 'next/headers';

import { DEV_COUNTRY_COOKIE_NAME, FALLBACK_COUNTRY } from '@/constants/countries';

export async function getUserCountry(): Promise<CountryCode> {
  const cookieStore = await cookies();
  const countryCookie = cookieStore.get(DEV_COUNTRY_COOKIE_NAME);

  if (countryCookie?.value) {
    return countryCookie.value as CountryCode;
  }

  const headersList = await headers();
  const cloudflareCountry = headersList.get('cf-ipcountry');

  if (!cloudflareCountry || cloudflareCountry === 'XX') {
    return FALLBACK_COUNTRY;
  }

  return cloudflareCountry as CountryCode;
}
