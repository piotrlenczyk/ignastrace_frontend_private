'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { useFeatures } from '@/hooks/use-features';

type ConsentContextType = {
  shouldShowConsent: boolean;
  setConsentGiven: (given: boolean) => void;
  checkConsentStatus: () => void;
};

export const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

type ConsentProviderProps = {
  children: ReactNode;
  isUSUser?: boolean;
};

const CONSENT_STORAGE_KEY = 'mobitrace-consent-given';

export function ConsentProvider({ children, isUSUser = false }: ConsentProviderProps) {
  const [shouldShowConsent, setShouldShowConsent] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { ENABLE_SMS_CONSENT: isSmsConsentEnabled } = useFeatures();

  const checkConsentStatus = useCallback(() => {
    const hasQueryParams = searchParams.toString().length > 0;

    const isBaseUrl = /^\/[a-z]{2}\/?$|^\/$/.test(pathname);

    if (hasQueryParams) {
      sessionStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      setShouldShowConsent(false);
    } else if (isBaseUrl) {
      const consentGiven = sessionStorage.getItem(CONSENT_STORAGE_KEY);
      if (consentGiven !== 'true') {
        const shouldShow = isUSUser && isSmsConsentEnabled;
        setShouldShowConsent(!!shouldShow);
      } else {
        setShouldShowConsent(false);
      }
    }
  }, [searchParams, pathname, isUSUser, isSmsConsentEnabled]);

  const setConsentGiven = useCallback((given: boolean) => {
    sessionStorage.setItem(CONSENT_STORAGE_KEY, given.toString());
    setShouldShowConsent(false);
  }, []);

  useEffect(() => {
    checkConsentStatus();
  }, [checkConsentStatus]);

  const value = useMemo(() => ({
    shouldShowConsent,
    setConsentGiven,
    checkConsentStatus,
  }), [shouldShowConsent, setConsentGiven, checkConsentStatus]);

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}
