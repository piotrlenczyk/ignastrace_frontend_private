import * as SquareFlags from 'country-flag-icons/react/1x1';
import type { CountryCode } from 'libphonenumber-js';

import { Icon } from '@/components/ui/icon';

export const Flag = ({ countryCode, size = 20 }: { countryCode?: CountryCode; size?: number }) => {
  const Comp = countryCode ? SquareFlags[countryCode] : null;

  return (
    <div className="phone-input-flag-wrapper size-(--size)" style={{ '--size': `${size}px` } as React.CSSProperties}>
      {Comp ? (
        <Comp
          style={{
            height: `${size}px`,
            width: `${size}px`,
          }}
        />
      ) : (
        <Icon name="globe" className="size-(--size) text-gray-700" />
      )}
    </div>
  );
};
