import { IconChatBubbleDotsLine, IconLinkAlt01, IconPhoneLine, IconShieldAlert } from '@/components/ui/icon/icons';
import type { ServiceRequest } from '@/types/service-request';

type ServiceRequestIconHeaderProps = {
  serviceRequest: ServiceRequest;
};

function getIconComponent(serviceRequest: ServiceRequest) {
  if (serviceRequest.source_type === 'ReverseLookup') {
    return IconPhoneLine;
  }

  if (serviceRequest.source_type === 'SexOffenderSearchReport') {
    return IconShieldAlert;
  }

  if (serviceRequest.source_type === 'Location' && serviceRequest.location.type === 'LinkLocation') {
    return IconLinkAlt01;
  }

  return IconChatBubbleDotsLine;
}

export const ServiceRequestIconHeader = ({ serviceRequest }: ServiceRequestIconHeaderProps) => {
  const IconComponent = getIconComponent(serviceRequest);

  return (
    <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
      <IconComponent className="size-5 text-white" />
    </div>
  );
};
