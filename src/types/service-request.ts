import type { LocationStatus, LocationType } from './location';

export type ServiceRequestStatus = LocationStatus | 'ready';
export type SourceType = 'Location' | 'ReverseLookup' | 'SexOffenderSearchReport';

export type ServiceRequest = {
  id: string;
  source_type: SourceType;
  status: ServiceRequestStatus;
  location: {
    lat: number;
    type: LocationType;
    lon: number;
    link: string;
    name?: string;
    address?: string;
  };
  phone?: string;
  status_updated_at: string;
};

export type ServiceRequestProps = {
  serviceRequest: ServiceRequest;
};

export type ServiceRequestsProps = {
  serviceRequests: ServiceRequest[];
};
