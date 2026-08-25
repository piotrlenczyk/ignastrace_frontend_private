/*
 * What is left of the legacy reverse-lookup shapes, and who still reads it.
 *
 * The report, its data-breach records and its sex-offender records are read from
 * the new API and typed from the generated specification, so the fat `ReverseLookup`
 * object and every enumeration only it used are gone. Three shapes survive because
 * two callers outside that migration still need them:
 *
 * - `ReverseLookupCompact` is what the anonymous funnel's legacy creation call
 *   answers with, kept there deliberately by ADR 0027;
 * - `ReverseLookupLocation` and `ReverseLookupPhoto` are read by the sex-offender
 *   *search* record, a different legacy endpoint on a different screen, which this
 *   migration does not touch.
 *
 * Nothing is added here. It goes when its last caller goes.
 */

export type ReverseLookupCompact = {
  id: string;
  phone: string;
  status: 'pending' | 'ready';
};

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
