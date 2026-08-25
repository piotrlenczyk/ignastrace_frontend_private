import type { SexOffenderDetail } from '@/server/getters/reverse-lookup.getters';

/*
 * The three things the legacy record stated and the new one does not.
 *
 * None of them is data the new API withheld; each is something it stopped
 * composing on the server. Composing them here keeps the screen's copy and its
 * layout exactly where they were, which is the whole brief for this migration.
 */

/**
 * The registrant's name, composed from the parts the record carries.
 *
 * The old backend sent a composed `name` beside the parts and the screen printed
 * it; the new one sends the parts alone.
 */
export const offenderName = ({ firstName, middleName, lastName }: SexOffenderDetail): string =>
  [firstName, middleName, lastName].filter(Boolean).join(' ');

/** Whole years between a date of birth and today, or nothing if none was stated. */
export const offenderAge = (dateOfBirth: SexOffenderDetail['dateOfBirth']): number | undefined => {
  if (!dateOfBirth) {
    return undefined;
  }

  const born = new Date(dateOfBirth);

  if (Number.isNaN(born.getTime())) {
    return undefined;
  }

  const now = new Date();
  const years = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());

  return beforeBirthday ? years - 1 : years;
};

const CENTIMETRES_PER_INCH = 2.54;
const POUNDS_PER_KILOGRAM = 2.2046226218;

/*
 * The new API states height in centimetres and weight in kilograms; this screen
 * states inches and pounds and keeps doing so. It is an American product reading
 * American registries, and a height in centimetres on a record from a state
 * registry reads as a defect rather than as a unit choice. The conversion is the
 * screen's, at render, and the unit change is recorded as a finding about the API.
 */

/** A height the API states in centimetres, in the inches the card is labelled for. */
export const inchesFromCm = (heightCm: SexOffenderDetail['heightCm']): number | undefined =>
  heightCm ? Math.round(heightCm / CENTIMETRES_PER_INCH) : undefined;

/** A weight the API states in kilograms, in the pounds the card is labelled for. */
export const poundsFromKg = (weightKg: SexOffenderDetail['weightKg']): number | undefined =>
  weightKg ? Math.round(weightKg * POUNDS_PER_KILOGRAM) : undefined;
