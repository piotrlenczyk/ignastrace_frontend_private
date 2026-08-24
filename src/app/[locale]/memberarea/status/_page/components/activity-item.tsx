'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';
import { ROUTES } from '@/constants/routes';
import { formatPhoneNumber } from '@/hooks/format-phone-number';
import { Link, useRouter } from '@/libs/i18n-routing';
import { cn } from '@/libs/utils';

import { type ActivityRow, isSettled } from '../activity-row';
import { statusFormatDate } from '../utils';
import { ActivityIconDescription } from './activity-icon-description';
import { ActivityIconHeader } from './activity-icon-header';
import { ActivityStatusBadge } from './activity-status-badge';

export const ActivityItem = ({ row }: { row: ActivityRow }) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('pages.status');

  /*
   * A row opens only once it has something to open. The inverse decides the
   * other affordance: a Location request that has not been answered is where
   * asking again belongs, and a row that has been answered is not.
   */
  const navigable = isSettled(row.status);
  const ContainerElement = navigable ? 'button' : 'div';

  const handleViewDetail = () => {
    switch (row.kind) {
      case 'REVERSE_LOOKUP_REPORT':
        return router.push(`${ROUTES.MEMBER.STATUS.REPORT}?id=${row.id}`);
      case 'SEX_OFFENDER_REPORT':
        return router.push(`${ROUTES.MEMBER.SEX_OFFENDERS_SEARCH.REPORT}?id=${row.id}`);
      default:
        return router.push(`${ROUTES.MEMBER.STATUS.DETAIL}?id=${row.id}`);
    }
  };

  /*
   * Asking again, for a Location request that has not been answered. A link-type
   * one is asked again by naming a new one, so it leads to the naming screen; a
   * number-type one leads back to the compose screen with the same recipient
   * already filled in, which is why the row carries an unformatted number.
   */
  const askAgainLink =
    row.kind === 'LOCATION_BY_LINK'
      ? ROUTES.MEMBER.FIND_BY_LINK.HOME
      : `${ROUTES.MEMBER.FIND_BY_NUMBER.MESSAGE_SENDING}?phone=${encodeURIComponent(row.title)}`;

  const isLocationRequest = row.kind === 'LOCATION_BY_LINK' || row.kind === 'LOCATION_BY_NUMBER';

  const cardTitle = () => {
    switch (row.kind) {
      case 'LOCATION_BY_LINK':
        return t('link_name', { name: row.title });
      case 'SEX_OFFENDER_REPORT':
        return row.title;
      default:
        return formatPhoneNumber(row.title).number;
    }
  };

  const cardDescription = () => {
    switch (row.kind) {
      case 'REVERSE_LOOKUP_REPORT':
        return t('reverse_lookup_description');
      case 'SEX_OFFENDER_REPORT':
        return t('sex_offender_report_description');
      default:
        return row.status === 'LOCATED'
          ? row.address
          : row.status === 'REJECTED'
            ? t('rejected_description')
            : t('pending_description');
    }
  };

  return (
    <ContainerElement
      className={cn(
        'rounded-lg border border-stroke-weak p-4 text-left text-strong hover:border-primary',
        navigable && 'w-full active:fill-press',
      )}
      type={navigable ? 'button' : undefined}
      onClick={navigable ? handleViewDetail : undefined}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-xs capitalize">{statusFormatDate(row.updatedAt, locale)}</div>
        <div className="flex gap-2">
          {!navigable && isLocationRequest && (
            <Link href={askAgainLink}>
              <Icon name="reload" className="size-4 text-neutral" />
            </Link>
          )}
          <ActivityStatusBadge status={row.status} t={t} />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <ActivityIconHeader kind={row.kind} />
        <h2 className="text-base font-bold">{cardTitle()}</h2>
      </div>

      <div className="flex items-start gap-2">
        <ActivityIconDescription status={row.status} />
        <p className="text-sm">{cardDescription()}</p>
      </div>
    </ContainerElement>
  );
};
