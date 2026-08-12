// Function to detect line type based on prefixes
export const detectLineType = (phoneNumber: string, country?: string): 'mobile' | 'landline' | 'voip' | 'unknown' => {
  if (!phoneNumber || !country) {
    return 'unknown';
  }

  // Mapping of country codes and their international prefixes
  const countryPrefixes: Record<string, string> = {
    ES: '34',
    MX: '52',
    AR: '54',
    GB: '44',
    FR: '33',
    DE: '49',
    IT: '39',
    BR: '55',
  };

  let nationalNumber = phoneNumber.replace(/^\+/, '').replace(/\D/g, '');

  // Remove country prefix if present
  const countryPrefix = countryPrefixes[country];
  if (countryPrefix && nationalNumber.startsWith(countryPrefix)) {
    nationalNumber = nationalNumber.substring(countryPrefix.length);
  }

  // Mapping of prefixes by country (most common ones only)
  const mobilePrefixes: Record<string, string[]> = {
    ES: ['6', '7'], // Spain: mobile numbers start with 6 or 7
    MX: ['55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69'], // México
    AR: ['11', '15', '16', '17', '18', '19'], // Argentina
    GB: ['7'], // United Kingdom: mobile numbers start with 7
    FR: ['6', '7'], // France: mobile numbers start with 6 or 7
    DE: ['15', '16', '17'], // Germany: mobile numbers start with 15, 16, 17
    IT: ['3'], // Italy: mobile numbers start with 3
    BR: [
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '21',
      '22',
      '24',
      '27',
      '28',
      '31',
      '32',
      '33',
      '34',
      '35',
      '37',
      '38',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '51',
      '53',
      '54',
      '55',
      '61',
      '62',
      '63',
      '64',
      '65',
      '66',
      '67',
      '68',
      '69',
      '71',
      '73',
      '74',
      '75',
      '77',
      '79',
      '81',
      '82',
      '83',
      '84',
      '85',
      '86',
      '87',
      '88',
      '89',
      '91',
      '92',
      '93',
      '94',
      '95',
      '96',
      '97',
      '98',
      '99',
    ], // Brasil
  };

  const prefixes = mobilePrefixes[country];
  if (!prefixes) {
    return 'unknown';
  }

  // Check if the number starts with any mobile prefix
  for (const prefix of prefixes) {
    if (nationalNumber.startsWith(prefix)) {
      return 'mobile';
    }
  }

  // If it doesn't match mobile prefixes, assume it's landline
  return 'landline';
};
