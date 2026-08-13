import { COUNTRIES_SAMPLE_DATA } from '@/constants/countries';

export type RecentLookupItem = {
  phoneNumber: string;
  title: string;
  country: string;
  time: number;
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
};

export const generateRecentLookups = (originCountry: string = 'ES'): RecentLookupItem[] => {
  const countries = Object.keys(COUNTRIES_SAMPLE_DATA);
  const otherCountries = countries.filter((country) => country !== originCountry);

  const items: RecentLookupItem[] = [];

  const originData = COUNTRIES_SAMPLE_DATA[originCountry as keyof typeof COUNTRIES_SAMPLE_DATA];
  if (originData) {
    for (let i = 0; i < 5; i++) {
      const phoneIndex = i % originData.phones.length;
      const nameIndex = i % originData.names.length;

      items.push({
        phoneNumber: originData.phones[phoneIndex]!,
        title: originData.names[nameIndex]!,
        country: originCountry,
        time: Math.floor(Math.random() * 59) + 1,
      });
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const randomCountry = countries[Math.floor(Math.random() * countries.length)];
      const countryData = COUNTRIES_SAMPLE_DATA[randomCountry as keyof typeof COUNTRIES_SAMPLE_DATA];

      if (countryData) {
        const phoneIndex = Math.floor(Math.random() * countryData.phones.length);
        const nameIndex = Math.floor(Math.random() * countryData.names.length);

        items.push({
          phoneNumber: countryData.phones[phoneIndex]!,
          title: countryData.names[nameIndex]!,
          country: randomCountry!,
          time: Math.floor(Math.random() * 59) + 1,
        });
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    const randomCountry = otherCountries[Math.floor(Math.random() * otherCountries.length)];
    const countryData = COUNTRIES_SAMPLE_DATA[randomCountry as keyof typeof COUNTRIES_SAMPLE_DATA];

    if (countryData) {
      const phoneIndex = Math.floor(Math.random() * countryData.phones.length);
      const nameIndex = Math.floor(Math.random() * countryData.names.length);

      items.push({
        phoneNumber: countryData.phones[phoneIndex]!,
        title: countryData.names[nameIndex]!,
        country: randomCountry!,
        time: Math.floor(Math.random() * 59) + 1,
      });
    }
  }

  return shuffleArray(items);
};
