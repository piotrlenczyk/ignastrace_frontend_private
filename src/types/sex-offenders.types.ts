import type { ReverseLookupLocation, ReverseLookupPhoto } from './reverse-lookup.types';

export type Sex = 'male' | 'female' | 'intersex';

export type EyeColor =
  | 'amber'
  | 'blue'
  | 'brown'
  | 'gray'
  | 'green'
  | 'hazel'
  | 'red'
  | 'violet'
  | 'other';

export type HairColor =
  | 'black'
  | 'brown'
  | 'blonde'
  | 'red'
  | 'gray'
  | 'white'
  | 'auburn'
  | 'chestnut'
  | 'dyed'
  | 'bald'
  | 'other';

export type Race =
  | 'white'
  | 'black_or_african_american'
  | 'asian'
  | 'native_american'
  | 'pacific_islander'
  | 'mixed'
  | 'other';

export type Ethnicity = 'hispanic' | 'non_hispanic' | 'other';

export type BodyPart =
  | 'head'
  | 'torso'
  | 'back'
  | 'left_arm'
  | 'right_arm'
  | 'left_hand'
  | 'right_hand'
  | 'left_leg'
  | 'right_leg';

export type RiskLevel = 'low' | 'medium' | 'high';

export type Job =
  | 'agriculture'
  | 'construction'
  | 'education'
  | 'engineering'
  | 'finance'
  | 'government'
  | 'healthcare'
  | 'hospitality'
  | 'information_technology'
  | 'legal'
  | 'manufacturing'
  | 'marketing'
  | 'military'
  | 'non_profit'
  | 'retail'
  | 'sales'
  | 'science'
  | 'skilled_trades'
  | 'transportation'
  | 'arts_and_entertainment'
  | 'media_and_communications'
  | 'real_estate'
  | 'telecommunications'
  | 'logistics_and_supply_chain'
  | 'energy_and_utilities'
  | 'other';

export type MaritalStatus =
  | 'single'
  | 'married'
  | 'divorced'
  | 'widowed'
  | 'separated'
  | 'in_relationship'
  | 'engaged'
  | 'domestic_partnership';

export type Education =
  | 'no_formal_education'
  | 'primary_school'
  | 'secondary_school'
  | 'high_school'
  | 'vocational_training'
  | 'associate_degree'
  | 'bachelor_degree'
  | 'master_degree'
  | 'doctoral_degree'
  | 'other';

export type MarkTatoo = {
  body_part: BodyPart;
  description: string;
};

export type SexOffenderData = {
  reverse_lookup_id?: string;
  reverse_lookup_owner_id?: string;
  is_empty_record: boolean;
  name: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  first_name_nick_names: string[];
  date_of_birth: string; // ISO date string (YYYY-MM-DD)
  age: number;
  sex: Sex;
  eye_color: EyeColor;
  hair_color: HairColor;
  race: Race;
  ethnicity: Ethnicity;
  height: number; // in inches
  weight: number; // in pounds
  marks: MarkTatoo[];
  crime: string;
  conviction_date: string; // ISO date string (YYYY-MM-DD)
  registration_date: string; // ISO date string (YYYY-MM-DD)
  risk_level: RiskLevel;
  jurisdiction: string;
  is_absconder: boolean;
  is_predator: boolean;
  original_source?: string;
  job?: Job;
  marital_status?: MaritalStatus;
  education?: Education;
  employment_status?: string;
  phone_number?: string;
  email?: string;
  social_media_profiles?: string[];
  aliases?: string[];
  case_number?: string;
  court?: string;
  sentence?: string;
  parole_status?: string;
  reverse_lookup_location?: ReverseLookupLocation;
  reverse_lookup_photos: ReverseLookupPhoto[];
  restrictions?: string[];
  victim_information?: {
    age_range: string;
    relationship: string;
  };
  upsell_purchased: boolean;
};

export type SexOffenderSearchMatch = {
  candidate_index: number;
  first_name: string;
  last_name: string;
  dob: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  photo_url: string | null;
};

export type SexOffenderSearch = {
  id: string;
  first_name: string;
  last_name: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  matches: SexOffenderSearchMatch[];
};
