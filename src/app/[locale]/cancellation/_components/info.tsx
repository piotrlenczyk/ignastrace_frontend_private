import type { ComponentType, ReactNode } from 'react';

export const Info = ({ description, Icon }:
{ description: string | ReactNode; Icon: ComponentType<{ className?: string }> }) => {
  return (
    <div className="flex items-start gap-3">
      <Icon className="size-6 text-secondary" />
      <div className="text-sm text-strong">{description}</div>
    </div>
  );
};
