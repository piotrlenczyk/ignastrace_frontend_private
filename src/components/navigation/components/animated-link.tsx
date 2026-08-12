'use client';

import type { MouseEvent, ReactNode } from 'react';

import { Link, useRouter } from '@/libs/i18n-routing';

export const AnimatedLink = (
  { children, className, href }:
  { children: ReactNode; className?: string; href: string },
) => {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <Link className={className} href={href} onClick={handleClick}>
      { children }
    </Link>
  );
};
