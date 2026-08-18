'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';

type CheckoutLoadingContextType = {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

const CheckoutLoadingContext = createContext<CheckoutLoadingContextType | undefined>(undefined);

export const CheckoutLoadingProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <CheckoutLoadingContext.Provider value={{ isLoading, setIsLoading }}>{children}</CheckoutLoadingContext.Provider>
  );
};

export const useCheckoutLoading = () => {
  const context = useContext(CheckoutLoadingContext);
  if (!context) {
    throw new Error('useCheckoutLoading must be used within CheckoutLoadingProvider');
  }
  return context;
};
