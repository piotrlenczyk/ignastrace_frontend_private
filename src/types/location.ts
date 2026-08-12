export type LocationStatus = 'located' | 'rejected' | 'pending';
export type LocationType = 'LinkLocation' | 'PhoneLocation';

export type Location = {
  id: string;
  type: LocationType;
  status: LocationStatus;
  lat: number;
  lon: number;
  link: string;
  name?: string;
  phone?: string;
  address?: string;
  status_updated_at: string;
};

export type LocationProps = {
  location: Location;
};

export type LocationsProps = {
  locations: Location[];
};
