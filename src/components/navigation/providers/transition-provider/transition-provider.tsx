'use client';

import classNames from 'classnames';
import React, { useMemo, useState } from 'react';

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
      <div className={classNames(className, containerClassName)}>
        {children}
      </div>
    </TransitionContext.Provider>
  );
}
