import * as RPNInput from 'react-phone-number-input';
import { Flag } from '../flag';

export const FlagComponent = ({ country }: RPNInput.FlagProps) => (
  <Flag countryCode={country} />
); 
