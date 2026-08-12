import type { CountryCode } from 'libphonenumber-js';
import { IconGlobeLine } from './icon/icons';
import * as SquareFlags from 'country-flag-icons/react/1x1';

export const Flag = ({ countryCode, size = 20 }: { countryCode?: CountryCode; size?: number }) => {
  const Comp = countryCode ? SquareFlags[countryCode] : null;

  return (
    <div
      className="phone-input-flag-wrapper size-[--size]"
      style={{ '--size': `${size}px` } as React.CSSProperties}
    >
      {Comp ? (
        <Comp
          style={{
            height: `${size}px`,
            width: `${size}px`
          }}
        />
      ) : (
        <IconGlobeLine className="flag-default size-[--size] text-gray-700" />
      )}
    </div>
  );
};
