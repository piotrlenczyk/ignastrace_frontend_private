import { Icon, type IconName } from '@/components/ui/icon';
import type { ServiceRequest } from '@/types/service-request';

type ServiceRequestIconHeaderProps = {
  serviceRequest: ServiceRequest;
};

function getIconName(serviceRequest: ServiceRequest): IconName {
  if (serviceRequest.source_type === 'ReverseLookup') {
    return 'phone';
  }

  if (serviceRequest.source_type === 'SexOffenderSearchReport') {
    return 'shield';
  }

  if (serviceRequest.source_type === 'Location' && serviceRequest.location.type === 'LinkLocation') {
    return 'link';
  }

  return 'chat';
}

export const ServiceRequestIconHeader = ({ serviceRequest }: ServiceRequestIconHeaderProps) => {
  const iconName = getIconName(serviceRequest);

  return (
    <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
      <Icon name={iconName} className="size-5 text-white" />
    </div>
  );
};
