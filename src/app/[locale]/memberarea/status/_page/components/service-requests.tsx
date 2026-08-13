'use client';

import { APIProvider } from '@vis.gl/react-google-maps';

import type { ServiceRequest } from '@/types/service-request';

import { ServiceRequestItem } from './service-request-item';

export const ServiceRequests = ({ serviceRequests }: { serviceRequests: ServiceRequest[] }) => {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
      <div className="mt-4 flex flex-col gap-4">
        {serviceRequests.map((serviceRequest) => (
          <ServiceRequestItem key={serviceRequest.id} serviceRequest={serviceRequest} />
        ))}
      </div>
    </APIProvider>
  );
};
