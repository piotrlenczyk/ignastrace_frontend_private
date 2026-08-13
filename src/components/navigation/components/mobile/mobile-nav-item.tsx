import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Link } from '@/libs/i18n-routing';

export const MobileNavItem = ({
  href,
  onClick,
  children,
  variant = 'ghost',
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
  variant?: 'ghost' | 'outline';
}) => {
  return (
    <Button asChild className="text-lg text-weak" size="lg" variant={variant} onClick={onClick}>
      <Link href={href}>{children}</Link>
    </Button>
  );
};
