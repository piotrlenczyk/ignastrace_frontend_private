import type { CountryCode} from 'libphonenumber-js';
import type * as RPNInput from 'react-phone-number-input';

export type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> &
Omit<RPNInput.Props<typeof RPNInput.default>, 'onChange'> & {
  onChange?: (value: RPNInput.Value) => void;
  onSelectCountry?: (value: CountryCode) => void;
};
