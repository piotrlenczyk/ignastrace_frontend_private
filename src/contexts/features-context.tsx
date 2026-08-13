'use client';

import { createContext, type ReactNode, useMemo } from 'react';

import type { Features } from '@/types/features';

type FeaturesContextType = {
  features: Features;
};

export const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined);

type FeaturesProviderProps = {
  children: ReactNode;
  features: Features;
};

export function FeaturesProvider({ children, features }: FeaturesProviderProps) {
  const value = useMemo(() => ({ features }), [features]);

  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}
