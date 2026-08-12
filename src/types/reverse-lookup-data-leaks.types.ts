export enum CompromisedDataType {
  EMAIL = 'email',
  PHONE = 'phone',
  NAME = 'name',
  USERNAME = 'username',
  PASSWORD = 'password',
  EDUCATION_LEVELS = 'education_levels',
  GENDER = 'gender',
  SOCIAL_MEDIA_PROFILES = 'social_media_profiles',
  GEO_LOCATION = 'geo_location',
}

export type ReverseLookupDataLeak = {
  id: string;
  service_name: string;
  date: string;
  image: string; // This is still not available in the API
  compromised_data: CompromisedDataType[];
  description: string;
};

export type ReverseLookupDataLeakResponse = {
  id: string;
  phone: string;
  photo?: string;
  reverse_lookup_data_leaks: ReverseLookupDataLeak[];
};
