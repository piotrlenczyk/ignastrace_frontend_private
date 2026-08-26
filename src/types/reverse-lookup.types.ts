/*
 * What is left of the legacy reverse-lookup shapes, and who still reads it.
 *
 * The report, its data-breach records and its sex-offender records are read from
 * the new API and typed from the generated specification, and the reports
 * themselves are created there too, so the fat `ReverseLookup` object, every
 * enumeration only it used, and the compact shape the legacy creation call
 * answered with are all gone. Two shapes survive because one caller outside that
 * migration still needs them: `ReverseLookupLocation` and `ReverseLookupPhoto`
 * are read by the sex-offender *search* record, a different legacy endpoint on a
 * different screen, which that migration does not touch.
 *
 * Nothing is added here. It goes when its last caller goes.
 */

export type ReverseLookupLocation = {
  id: string;
  address?: string;
  city?: string;
  county?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  years_of_residence?: number;
};

export type PhotoSource = 'whatsapp' | 'other';

export type ReverseLookupPhoto = {
  id: string;
  content: string;
  source: PhotoSource;
};
