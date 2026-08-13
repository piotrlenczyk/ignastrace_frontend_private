'use client';

import type { CountryCode } from 'libphonenumber-js';
import { createContext, type ReactNode, useMemo } from 'react';

type CountryContextType = {
  country: CountryCode;
};

export const CountryContext = createContext<CountryContextType | undefined>(undefined);

type CountryProviderProps = {
  country: CountryCode;
  children: ReactNode;
};

export function CountryProvider({ country, children }: CountryProviderProps) {
  const value = useMemo(() => ({ country }), [country]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}
