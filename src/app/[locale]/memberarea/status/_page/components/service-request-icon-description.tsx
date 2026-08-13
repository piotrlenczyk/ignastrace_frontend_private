import { Icon } from '@/components/ui/icon';
import type { ServiceRequestStatus } from '@/types/service-request';

type ServiceRequestIconDescriptionProps = {
  status: ServiceRequestStatus;
};

export const ServiceRequestIconDescription = ({ status }: ServiceRequestIconDescriptionProps) => {
  const icons = {
    located: <Icon name="pin-location" className="text-success" />,
    ready: <Icon name="list-check" className="text-neutral" />,
    rejected: <Icon name="pin-location" className="text-error" />,
    pending: <Icon name="info" className="text-neutral" />,
  };

  return icons[status] || icons.pending;
};
