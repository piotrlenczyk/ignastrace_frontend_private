import { useTranslations } from 'next-intl';

import type { schemas } from '@/network/api/apiServerClient';

/*
 * Every enumeration the four report screens render, resolved to a label in one
 * place.
 *
 * The new API states each of these values in upper case where the legacy backend
 * stated it in lower case — `BLACK_OR_AFRICAN_AMERICAN` for `black_or_african_american`,
 * `IN_RELATIONSHIP` for `in_relationship` — and the message catalogues are keyed
 * by the legacy spelling. Re-keying them is not on the table: there are 24, this
 * repository may only edit the English one, and re-keying that one alone would
 * strand 23 languages. So the value is lower-cased to reach the key it already
 * has, and that lower-casing happens here rather than in a dozen components.
 *
 * It is a cast rather than a conversion because `Lowercase<Value>` is exactly
 * what `toLowerCase()` produces for these values, and stating it keeps the key a
 * literal union — which is what lets next-intl's typed messages check it. A key
 * assembled out of a plain `string` compiles whatever the value is, which is the
 * one class of error in this migration the compiler could not otherwise see.
 */
const enumKey = <Value extends string>(value: Value) => value.toLowerCase() as Lowercase<Value>;

/*
 * Proof, at compile time, that a list names every member of the generated
 * enumeration it stands for.
 *
 * The lists exist for the test below this module, which walks them against the
 * real English catalogue. They would be worth little if they were hand-written
 * and free to fall behind the specification, so the second parameter makes that
 * impossible: a value added upstream leaves `Exclude` non-empty, which demands an
 * argument nobody passes, and the build fails naming the value that is missing.
 */
const covering =
  <Union extends string>() =>
  <Listed extends readonly Union[]>(
    values: Listed,
    ..._missing: [Exclude<Union, Listed[number]>] extends [never]
      ? []
      : [`this list is missing: ${Exclude<Union, Listed[number]>}`]
  ): readonly Union[] =>
    values;

type Owner = schemas['SectionedReportOwnerResponse'];
type SexOffender = schemas['SexOffenderDetailResponse'];

type LineType = schemas['SectionedReportProfileResponse']['lineType'];
type OwnerSource = NonNullable<Owner['source']>;
type Gender = NonNullable<Owner['gender']>;
type MaritalStatus = NonNullable<Owner['maritalStatus']>;
type Job = Owner['jobs'][number];
type Education = Owner['education'][number];
type SocialKind = schemas['SectionedReportSocialMediaAccountResponse']['kind'];
type CompromisedData = schemas['DataBreachLeakResponse']['compromisedData'][number];
type Sex = NonNullable<SexOffender['sex']>;
type EyeColor = NonNullable<SexOffender['eyeColor']>;
type HairColor = NonNullable<SexOffender['hairColor']>;
type Race = NonNullable<SexOffender['race']>;
type Ethnicity = NonNullable<SexOffender['ethnicity']>;
type RiskLevel = NonNullable<SexOffender['riskLevel']>;

const REPORT = 'pages.reverse_lookup.report';

/**
 * Where the copy this migration adds lives. One value reaches it — `UNKNOWN` for
 * a line type — because it is the only value in any of these enumerations that
 * the legacy backend never returned and no catalogue therefore has a key for. The
 * other three the specification for this work named as needing new copy turned
 * out to be translated already, in all 24 catalogues.
 */
const ADDED = '__NEW__.reverse_lookup_report';

/**
 * Every value of every enumeration the four screens render, with the namespace
 * its label is keyed under.
 *
 * This is what the test walks. It is also the closest this repository can get to
 * "walk the values out of the generated specification": the specification is a
 * declaration file, so it publishes no values at run time, and the `covering`
 * check above is what makes these lists stand in for it safely.
 */
export const REPORT_ENUM_LABELS = [
  {
    group: 'lineType',
    namespace: `${REPORT}.carrier_details.line_types`,
    values: covering<LineType>()(['MOBILE', 'LANDLINE', 'UNKNOWN']),
  },
  {
    group: 'ownerSource',
    namespace: `${REPORT}.phone_public_information.sources`,
    values: covering<OwnerSource>()(['SOCIAL_MEDIA', 'PUBLIC_RECORDS', 'DATA_BREACH', 'OTHER']),
  },
  {
    group: 'gender',
    namespace: `${REPORT}.possible_personal_details.values`,
    values: covering<Gender>()(['MALE', 'FEMALE', 'INTERSEX']),
  },
  {
    group: 'maritalStatus',
    namespace: `${REPORT}.possible_personal_details.values`,
    values: covering<MaritalStatus>()([
      'SINGLE',
      'MARRIED',
      'DIVORCED',
      'WIDOWED',
      'SEPARATED',
      'IN_RELATIONSHIP',
      'ENGAGED',
      'DOMESTIC_PARTNERSHIP',
    ]),
  },
  {
    group: 'job',
    namespace: `${REPORT}.potential_professional_summary.values`,
    values: covering<Job>()([
      'AGRICULTURE',
      'CONSTRUCTION',
      'EDUCATION',
      'ENGINEERING',
      'FINANCE',
      'GOVERNMENT',
      'HEALTHCARE',
      'HOSPITALITY',
      'INFORMATION_TECHNOLOGY',
      'LEGAL',
      'MANUFACTURING',
      'MARKETING',
      'MILITARY',
      'NON_PROFIT',
      'RETAIL',
      'SALES',
      'SCIENCE',
      'SKILLED_TRADES',
      'TRANSPORTATION',
      'ARTS_AND_ENTERTAINMENT',
      'MEDIA_AND_COMMUNICATIONS',
      'REAL_ESTATE',
      'TELECOMMUNICATIONS',
      'LOGISTICS_AND_SUPPLY_CHAIN',
      'ENERGY_AND_UTILITIES',
      'OTHER',
    ]),
  },
  {
    group: 'education',
    namespace: `${REPORT}.potential_education.values`,
    values: covering<Education>()([
      'NO_FORMAL_EDUCATION',
      'PRIMARY_SCHOOL',
      'SECONDARY_SCHOOL',
      'HIGH_SCHOOL',
      'VOCATIONAL_TRAINING',
      'ASSOCIATE_DEGREE',
      'BACHELOR_DEGREE',
      'MASTER_DEGREE',
      'DOCTORAL_DEGREE',
      'OTHER',
    ]),
  },
  {
    group: 'socialKind',
    namespace: `${REPORT}.possible_social_media_accounts.sources`,
    values: covering<SocialKind>()([
      'BEHANCE',
      'FACEBOOK',
      'GITHUB',
      'GITLAB',
      'GOOGLE',
      'INSTAGRAM',
      'KICK',
      'LINKEDIN',
      'PINTEREST',
      'REDDIT',
      'SNAPCHAT',
      'TELEGRAM',
      'THREADS',
      'TIKTOK',
      'TUMBLR',
      'TWITCH',
      'X',
      'YOUTUBE',
    ]),
  },
  {
    group: 'compromisedData',
    namespace: `${REPORT}.data_breach_history.report.data_types`,
    values: covering<CompromisedData>()([
      'EMAIL',
      'PHONE',
      'NAME',
      'USERNAME',
      'PASSWORD',
      'EDUCATION_LEVELS',
      'GENDER',
      'SOCIAL_MEDIA_PROFILES',
      'GEO_LOCATION',
      'DATE_OF_BIRTH',
    ]),
  },
  {
    group: 'sex',
    namespace: `${REPORT}.sex_offenders.report.values.sex`,
    values: covering<Sex>()(['MALE', 'FEMALE', 'INTERSEX']),
  },
  {
    group: 'eyeColor',
    namespace: `${REPORT}.sex_offenders.report.values.eye_color`,
    values: covering<EyeColor>()(['AMBER', 'BLUE', 'BROWN', 'GRAY', 'GREEN', 'HAZEL', 'RED', 'VIOLET', 'OTHER']),
  },
  {
    group: 'hairColor',
    namespace: `${REPORT}.sex_offenders.report.values.hair_color`,
    values: covering<HairColor>()([
      'BLACK',
      'BROWN',
      'BLONDE',
      'RED',
      'GRAY',
      'WHITE',
      'AUBURN',
      'CHESTNUT',
      'DYED',
      'BALD',
      'OTHER',
    ]),
  },
  {
    group: 'race',
    namespace: `${REPORT}.sex_offenders.report.values.race`,
    values: covering<Race>()([
      'WHITE',
      'BLACK_OR_AFRICAN_AMERICAN',
      'ASIAN',
      'NATIVE_AMERICAN',
      'PACIFIC_ISLANDER',
      'MIXED',
      'OTHER',
    ]),
  },
  {
    group: 'ethnicity',
    namespace: `${REPORT}.sex_offenders.report.values.ethnicity`,
    values: covering<Ethnicity>()(['HISPANIC', 'NON_HISPANIC', 'OTHER']),
  },
  {
    group: 'riskLevel',
    namespace: `${REPORT}.sex_offenders.report.values.risk_level`,
    values: covering<RiskLevel>()(['LOW', 'MEDIUM', 'HIGH']),
  },
] as const;

/**
 * The values that resolve through the added copy rather than through the
 * namespace their group is keyed under, with the key each reaches.
 *
 * One entry, and the test asserts both that it is there and that it is the only
 * one that needs to be.
 */
export const REPORT_ENUM_FALLBACKS = [
  { group: 'lineType', value: 'UNKNOWN', namespace: ADDED, key: 'line_types.unknown' },
] as const;

/**
 * The line type on the carrier card.
 *
 * `UNKNOWN` is the one value in this whole family the legacy backend never
 * returned, so it is the one value with no key in any catalogue and the one that
 * reaches the added copy. Everything else is the existing label.
 */
export const useLineTypeLabel = () => {
  const t = useTranslations(`${REPORT}.carrier_details.line_types`);
  const added = useTranslations(`${ADDED}.line_types`);

  return (lineType: LineType) => (lineType === 'UNKNOWN' ? added('unknown') : t(enumKey(lineType)));
};

/** Where the lookup found an owner: a social network, public records, a breach. */
export const useOwnerSourceLabel = () => {
  const t = useTranslations(`${REPORT}.phone_public_information.sources`);

  return (source: OwnerSource) => t(enumKey(source));
};

/** Gender and marital status, which share one namespace on the personal card. */
export const usePersonalDetailLabels = () => {
  const t = useTranslations(`${REPORT}.possible_personal_details.values`);

  return {
    gender: (gender: Gender) => t(enumKey(gender)),
    maritalStatus: (maritalStatus: MaritalStatus) => t(enumKey(maritalStatus)),
  };
};

/** One line of the professional summary. */
export const useJobLabel = () => {
  const t = useTranslations(`${REPORT}.potential_professional_summary.values`);

  return (job: Job) => t(enumKey(job));
};

/** One line of the education summary. */
export const useEducationLabel = () => {
  const t = useTranslations(`${REPORT}.potential_education.values`);

  return (education: Education) => t(enumKey(education));
};

/** The platform a social account was found on. */
export const useSocialKindLabel = () => {
  const t = useTranslations(`${REPORT}.possible_social_media_accounts.sources`);

  return (kind: SocialKind) => t(enumKey(kind));
};

/** One category of data a breach compromised. */
export const useCompromisedDataLabel = () => {
  const t = useTranslations(`${REPORT}.data_breach_history.report.data_types`);

  return (compromised: CompromisedData) => t(enumKey(compromised));
};

/** Everything the sex-offender record states as an enumeration. */
export const useSexOffenderLabels = () => {
  const t = useTranslations(`${REPORT}.sex_offenders.report.values`);

  return {
    sex: (sex: Sex) => t(`sex.${enumKey(sex)}`),
    eyeColor: (eyeColor: EyeColor) => t(`eye_color.${enumKey(eyeColor)}`),
    hairColor: (hairColor: HairColor) => t(`hair_color.${enumKey(hairColor)}`),
    race: (race: Race) => t(`race.${enumKey(race)}`),
    ethnicity: (ethnicity: Ethnicity) => t(`ethnicity.${enumKey(ethnicity)}`),
    riskLevel: (riskLevel: RiskLevel) => t(`risk_level.${enumKey(riskLevel)}`),
  };
};
