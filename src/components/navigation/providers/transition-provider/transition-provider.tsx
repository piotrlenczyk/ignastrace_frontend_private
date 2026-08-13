'use client';

import React, { useMemo, useState } from 'react';

import { cn } from '@/libs/utils';

import { type Animation, TransitionContext } from './transition-context';

export function TransitionProvider({
  children,
  containerClassName,
}: React.PropsWithChildren<{
  containerClassName: string;
}>) {
  const [className, setClassName] = useState<Animation>('animate-fade-in');

  const value = useMemo(() => ({ className, setClassName }), [className, setClassName]);

  return (
    <TransitionContext.Provider value={value}>
      <div className={cn(className, containerClassName)}>{children}</div>
    </TransitionContext.Provider>
  );
}
