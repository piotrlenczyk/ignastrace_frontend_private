'use client';

import { useLocale, useTranslations } from 'next-intl';

import {
  IconRefreshCw,
} from '@/components/ui/icon/icons';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { Link, useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';
import type { ServiceRequestProps } from '@/types/service-request';

import { statusFormatDate } from '../utils';
import { ServiceRequestIconDescription } from './service-request-icon-description';
import { ServiceRequestIconHeader } from './service-request-icon-header';
import { ServiceRequestStatusBadge } from './service-request-status-badge';

export const ServiceRequestItem = ({ serviceRequest }: ServiceRequestProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('pages.status');

  const isReady = serviceRequest.status === 'located' || serviceRequest.status === 'ready';
  const ContainerElement = isReady ? 'button' : 'div';

  const handleViewDetail = () => {
    switch (serviceRequest.source_type) {
      case 'ReverseLookup':
        return router.push(`${ROUTES.MEMBER.STATUS.REPORT}?id=${serviceRequest.id}`);
      case 'SexOffenderSearchReport':
        return router.push(`${ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.REPORT}?id=${serviceRequest.id}`);
      default:
        return router.push(`${ROUTES.MEMBER.STATUS.DETAIL}?id=${serviceRequest.id}`);
    }
  };

  const refreshLocationLink = serviceRequest.location.type === 'LinkLocation'
    ? ROUTES.MEMBER.FIND_BY_LINK.HOME
    : `${ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING}?phone=${encodeURIComponent(serviceRequest.phone as string)}`;

  const formattedPhone = formatPhoneNumber(serviceRequest.phone as string).number;

  const cardTitle = () => {
    switch (serviceRequest.source_type) {
      case 'Location':
        return serviceRequest.location.type === 'LinkLocation'
          ? t('link_name', { name: serviceRequest.location.name ?? '' })
          : formattedPhone;
      case 'SexOffenderSearchReport':
        return serviceRequest.location.name;
      case 'ReverseLookup':
      default:
        return formattedPhone;
    }
  };

  const cardDescription = () => {
    switch (serviceRequest.source_type) {
      case 'ReverseLookup':
        return t('reverse_lookup_description');
      case 'SexOffenderSearchReport':
        return t('sex_offender_report_description');
      default:
        return serviceRequest.status === 'located'
          ? serviceRequest.location.address
          : serviceRequest.status === 'rejected'
            ? t('rejected_description')
            : t('pending_description');
    }
  };

  return (
    <ContainerElement
      className={cn(
        'rounded-lg border border-stroke-weak p-4 text-left text-strong hover:border-primary',
        isReady && 'w-full active:fill-press',
      )}
      type={isReady ? 'button' : undefined}
      onClick={isReady ? handleViewDetail : undefined}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-xs capitalize">
          {statusFormatDate(serviceRequest.status_updated_at, locale)}
        </div>
        <div className="flex gap-2">
          {!isReady && serviceRequest.source_type === 'Location' && (
            <button type="button" className="p-0">
              <Link href={refreshLocationLink}>
                <IconRefreshCw size="medium" className="text-neutral" />
              </Link>
            </button>
          )}
          <ServiceRequestStatusBadge status={serviceRequest.status} t={t} />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <ServiceRequestIconHeader serviceRequest={serviceRequest} />
        <h2 className="text-base font-bold">
          { cardTitle() }
        </h2>
      </div>

      <div className="flex items-start gap-2">
        <ServiceRequestIconDescription status={serviceRequest.status} />
        <p className="text-sm">{cardDescription()}</p>
      </div>
    </ContainerElement>
  );
};
