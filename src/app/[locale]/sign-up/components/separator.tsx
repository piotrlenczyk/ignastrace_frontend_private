import clsx from 'clsx';
import type { ReactNode } from 'react';

export const Separator = ({ children }: { children: ReactNode }) => {
  const beforeCSS = `before:w-full before:h-px before:bg-gray-100 before:-left-0`;
  const afterCSS = `  after:w-full  after:h-px  after:bg-gray-100  after:-right-0`;

  return (
    <div className={clsx('flex w-full items-center text-center', beforeCSS, afterCSS)}>
      <span className="px-4 text-sm uppercase">{children}</span>
    </div>
  );
};
