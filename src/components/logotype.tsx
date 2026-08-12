import Image from 'next/image';
import type { FC } from 'react';

type LogotypeProps = {
  className?: string;
};

export const Logotype: FC<LogotypeProps> = ({ className }) => {
  return (
    <Image
      src="/images/mobitrace-logotype.svg"
      width="134"
      height="32"
      alt="Mobitrace"
      className={className}
      priority
    />
  );
};
