import { isPossiblePhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

export const usePhoneNumberFormatter = (phoneNumber: string | undefined) => {
  if (!phoneNumber || !isPossiblePhoneNumber(phoneNumber)) {
    return {
      number: phoneNumber || '',
      country: null,
      valid: false,
    };
  }

  const parsedPhoneNumber = parsePhoneNumber(phoneNumber);
  const formattedNumber = parsedPhoneNumber.formatInternational();

  return {
    number: formattedNumber,
    country: parsedPhoneNumber.country,
    valid: true,
  };
};
