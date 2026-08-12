'use client';

import { useContext } from 'react';

import { CountryContext } from '@/contexts/country-context';

export function useCountry() {
  const context = useContext(CountryContext);

  if (context === undefined) {
    throw new Error('useCountry must be used inside a CountryProvider');
  }

  return context.country;
}
