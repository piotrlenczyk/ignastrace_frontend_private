import type { CountryCode } from 'libphonenumber-js';

export const formatPhoneNumberPlaceholder = (countryCode: CountryCode): string => {
  switch (countryCode) {
    case 'AE': // United Arab Emirates
      return '50 123 4567';
    case 'AR': // Argentina
      return '11 99999-9999';
    case 'AT': // Austria
      return '664 123456';
    case 'AU': // Australia
      return '4 1234 5678';
    case 'BE': // Belgium
      return '470 12 34 56';
    case 'BH': // Bahrain
      return '33 123 456';
    case 'BG': // Bulgaria
      return '888 123 456';
    case 'BR': // Brazil
      return '(11) 99999-9999';
    case 'CH': // Switzerland
      return '76 123 45 67';
    case 'CL': // Chile
      return '9 1234 5678';
    case 'CN': // China
      return '130 1234 5678';
    case 'CO': // Colombia
      return '300 123 4567';
    case 'CZ': // Czech Republic
      return '777 123 456';
    case 'DE': // Germany
      return '100 123456';
    case 'DK': // Denmark
      return '20 12 34 56';
    case 'ES': // Spain
      return '600 123 456';
    case 'FI': // Finland
      return '40 123 4567';
    case 'FR': // France
      return '6 00 12 34 56';
    case 'GB': // United Kingdom
      return '700 123 456';
    case 'GR': // Greece
      return '69 1234 5678';
    case 'HK': // Hong Kong
      return '5123 4567';
    case 'HR': // Croatia
      return '99 123 4567';
    case 'HU': // Hungary
      return '6 30 123 4567';
    case 'ID': // Indonesia
      return '812 3456 7890';
    case 'IE': // Ireland
      return '83 123 4567';
    case 'IL': // Israel
      return '50 123 4567';
    case 'IN': // India
      return '91 12345 67890';
    case 'IT': // Italy
      return '300 123 456';
    case 'JP': // Japan
      return '90 1234 5678';
    case 'KR': // South Korea
      return '10 1234 5678';
    case 'KW': // Kuwait
      return '500 12345';
    case 'MX': // Mexico
      return '55 99999-9999';
    case 'MY': // Malaysia
      return '12 345 6789';
    case 'NL': // Netherlands
      return '6 12345678';
    case 'NO': // Norway
      return '400 12 345';
    case 'NZ': // New Zealand
      return '21 123 456';
    case 'OM': // Oman
      return '95 123456';
    case 'PE': // Peru
      return '999 123 456';
    case 'PH': // Philippines
      return '915 123 4567';
    case 'PL': // Poland
      return '500 123 456';
    case 'PT': // Portugal
      return '900 123 456';
    case 'QA': // Qatar
      return '55 123 4567';
    case 'RO': // Romania
      return '712 345 678';
    case 'RS': // Serbia
      return '60 123 4567';
    case 'SA': // Saudi Arabia
      return '5 1234 5678';
    case 'SE': // Sweden
      return '70 123 4567';
    case 'SG': // Singapore
      return '8123 4567';
    case 'SI': // Slovenia
      return '31 123 456';
    case 'SK': // Slovakia
      return '900 123 456';
    case 'TH': // Thailand
      return '81 234 5678';
    case 'TR': // Turkey
      return '530 123 4567';
    case 'TW': // Taiwan
      return '912 345 678';
    case 'UA': // Ukraine
      return '50 123 4567';
    case 'US': // United States
      return '(100) 123-456';
    case 'VE': // Venezuela
      return '412 123 4567';
    case 'VN': // Vietnam
      return '91 234 5678';
    case 'ZA': // South Africa
      return '60 123 4567';
    default:
      return '123456789';
  }
};
