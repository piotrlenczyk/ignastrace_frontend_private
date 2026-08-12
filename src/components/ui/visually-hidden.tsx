import * as RadixVisuallyHidden from '@radix-ui/react-visually-hidden';
import type { ReactNode } from 'react';

type VisuallyHiddenProps = {
  children: ReactNode;
};

const VisuallyHidden = ({ children, ...props }: VisuallyHiddenProps) => {
  return (
    <RadixVisuallyHidden.Root {...props}>
      {children}
    </RadixVisuallyHidden.Root>
  );
};

export default VisuallyHidden;
