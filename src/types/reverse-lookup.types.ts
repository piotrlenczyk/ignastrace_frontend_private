// Constants for reverse lookup enums
export const SOURCE_VALUES = [
  'social_media',
  'public_records',
  'data_breach',
  'other',
] as const;

export const SEX_VALUES = [
  'male',
  'female',
  'intersex',
] as const;

export const EYE_COLOR_VALUES = [
  'amber',
  'blue',
  'brown',
  'gray',
  'green',
  'hazel',
  'red',
  'violet',
  'other',
] as const;

export const HAIR_COLOR_VALUES = [
  'black',
  'brown',
  'blonde',
  'red',
  'gray',
  'white',
  'auburn',
  'chestnut',
  'dyed',
  'bald',
  'other',
] as const;

export const RACE_VALUES = [
  'white',
  'black_or_african_american',
  'asian',
  'native_american',
  'pacific_islander',
  'mixed',
  'other',
] as const;

export const ETHNICITY_VALUES = [
  'hispanic',
  'non_hispanic',
  'other',
] as const;

export const BODY_PART_VALUES = [
  'head',
  'torso',
  'back',
  'left_arm',
  'right_arm',
  'left_hand',
  'right_hand',
  'left_leg',
  'right_leg',
] as const;

export const RISK_LEVEL_VALUES = [
  'low',
  'medium',
  'high',
] as const;

export const JOB_VALUES = [
  'agriculture',
  'construction',
  'education',
  'engineering',
  'finance',
  'government',
  'healthcare',
  'hospitality',
  'information_technology',
  'legal',
  'manufacturing',
  'marketing',
  'military',
  'non_profit',
  'retail',
  'sales',
  'science',
  'skilled_trades',
  'transportation',
  'arts_and_entertainment',
  'media_and_communications',
  'real_estate',
  'telecommunications',
  'logistics_and_supply_chain',
  'energy_and_utilities',
  'other',
] as const;

export const MARITAL_STATUS_VALUES = [
  'single',
  'married',
  'divorced',
  'widowed',
  'separated',
  'in_relationship',
  'engaged',
  'domestic_partnership',
] as const;

export const EDUCATION_VALUES = [
  'no_formal_education',
  'primary_school',
  'secondary_school',
  'high_school',
  'vocational_training',
  'associate_degree',
  'bachelor_degree',
  'master_degree',
  'doctoral_degree',
  'other',
] as const;

// Type definitions for the constants
export type Source = typeof SOURCE_VALUES[number];
export type Sex = typeof SEX_VALUES[number];
export type EyeColor = typeof EYE_COLOR_VALUES[number];
export type HairColor = typeof HAIR_COLOR_VALUES[number];
export type Race = typeof RACE_VALUES[number];
export type Ethnicity = typeof ETHNICITY_VALUES[number];
export type BodyPart = typeof BODY_PART_VALUES[number];
export type RiskLevel = typeof RISK_LEVEL_VALUES[number];
export type Job = typeof JOB_VALUES[number];
export type MaritalStatus = typeof MARITAL_STATUS_VALUES[number];
export type Education = typeof EDUCATION_VALUES[number];

export type ReverseLookupCompact = {
  id: string;
  phone: string;
  status: 'pending' | 'ready';
};

export const SOCIAL_MEDIA_KIND_VALUES = [
  'behance',
  'facebook',
  'github',
  'gitlab',
  'instagram',
  'kick',
  'pinterest',
  'reddit',
  'snapchat',
  'telegram',
  'threads',
  'tiktok',
  'tumblr',
  'twitch',
  'x',
  'youtube',
] as const;

export type SocialMediaKind = typeof SOCIAL_MEDIA_KIND_VALUES[number];

export type SocialMediaAccount = {
  id: string;
  kind: SocialMediaKind;
  url: string;
  username: string;
  progress_status: 'new' | 'processing' | 'done';
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

export type ReverseLookupOwner = {
  id: string;
  name: string;
  source?: Source;
  email?: string;
  phone?: string;
  usernames?: string[];
  country_code?: string;
  date_of_birth?: string;
  gender?: Sex;
  marital_status?: MaritalStatus;
  jobs?: Job[];
  education?: Education[];
  has_children?: boolean;
  num_children?: number;
  household_size?: number;
  income_min?: number;
  income_max?: number;
  reverse_lookup_location?: ReverseLookupLocation;
};

export type SexOffenderReport = {
  id: string;
  name: string;
  upsell_purchased: boolean;
  reverse_lookup_owner_id: string;
  is_empty_record: boolean;
};

export type PhotoSource = 'whatsapp' | 'other';

export type ReverseLookupPhoto = {
  id: string;
  content: string;
  source: PhotoSource;
};

export type ReverseLookup = ReverseLookupCompact & {
  phone_formats: {
    international: string;
    local: string;
  };
  line_type: 'mobile' | 'landline';
  carrier: string;
  country: string;
  reverse_lookup_photos: ReverseLookupPhoto[];
  reverse_lookup_social_media_accounts: SocialMediaAccount[];
  reverse_lookup_owners: ReverseLookupOwner[];
  sex_offender_reports: SexOffenderReport[];
  reverse_lookup_sex_offenders_upsell_purchased: boolean;
  reverse_lookup_data_leaks_count: number;
  reverse_lookup_data_leaks_upsell_purchased: boolean;
  reverse_lookup_social_networks_upsell_purchased: boolean;
};
