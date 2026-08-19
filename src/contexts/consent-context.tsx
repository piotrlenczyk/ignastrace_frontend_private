'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { useSettings } from '@/settings/settings.provider';

type ConsentContextType = {
  shouldShowConsent: boolean;
  setConsentGiven: (given: boolean) => void;
  checkConsentStatus: () => void;
};

export const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

type ConsentProviderProps = {
  children: ReactNode;
};

const CONSENT_STORAGE_KEY = 'mobitrace-consent-given';

export function ConsentProvider({ children }: ConsentProviderProps) {
  const [shouldShowConsent, setShouldShowConsent] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /*
   * Both halves of the question come from the same place now. The country used to
   * arrive as a prop because it lived in a provider of its own; there is one
   * provider to ask, so there is no prop.
   */
  const { smsConsentEnabled, countryCode } = useSettings();
  const isUSUser = countryCode === 'US';

  const checkConsentStatus = useCallback(() => {
    const hasQueryParams = searchParams.toString().length > 0;

    const isBaseUrl = /^\/[a-z]{2}\/?$|^\/$/.test(pathname);

    if (hasQueryParams) {
      sessionStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      setShouldShowConsent(false);
    } else if (isBaseUrl) {
      const consentGiven = sessionStorage.getItem(CONSENT_STORAGE_KEY);
      if (consentGiven !== 'true') {
        const shouldShow = isUSUser && smsConsentEnabled;
        setShouldShowConsent(!!shouldShow);
      } else {
        setShouldShowConsent(false);
      }
    }
  }, [searchParams, pathname, isUSUser, smsConsentEnabled]);

  const setConsentGiven = useCallback((given: boolean) => {
    sessionStorage.setItem(CONSENT_STORAGE_KEY, given.toString());
    setShouldShowConsent(false);
  }, []);

  useEffect(() => {
    checkConsentStatus();
  }, [checkConsentStatus]);

  const value = useMemo(
    () => ({
      shouldShowConsent,
      setConsentGiven,
      checkConsentStatus,
    }),
    [shouldShowConsent, setConsentGiven, checkConsentStatus],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}
