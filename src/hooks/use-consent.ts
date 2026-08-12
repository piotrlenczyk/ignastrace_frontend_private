'use client';

import { useContext } from 'react';

import { ConsentContext } from '@/contexts/consent-context';

export function useConsent() {
  const context = useContext(ConsentContext);
  if (context === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
}
