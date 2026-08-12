import {
  IconClipboardList,
  IconInfoCircleLine,
  IconLocationPinCancelLine,
  IconLocationPinCheck,
} from '@/components/ui/icon/icons';
import type { ServiceRequestStatus } from '@/types/service-request';

type ServiceRequestIconDescriptionProps = {
  status: ServiceRequestStatus;
};

export const ServiceRequestIconDescription = ({ status }: ServiceRequestIconDescriptionProps) => {
  const icons = {
    located: <IconLocationPinCheck size="large" className="text-success" />,
    ready: <IconClipboardList size="large" className="text-neutral" />,
    rejected: <IconLocationPinCancelLine size="large" className="text-error" />,
    pending: <IconInfoCircleLine size="large" className="text-neutral" />,
  };

  return icons[status] || icons.pending;
};
