'use client';

import { useContext } from 'react';

import { FeaturesContext } from '@/contexts/features-context';

// This is meant to be called on the client side only. For server side, use the getFeatures function.
// If you use this hook on the server side, it will throw an error like this:
// Error: (0 , _hooks_use_features__WEBPACK_IMPORTED_MODULE_3__.useFeatures) is not a function.
export function useFeatures() {
  const context = useContext(FeaturesContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeaturesProvider');
  }
  return context.features;
}
