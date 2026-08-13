import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { IconCheckCircle, IconLoaderCircle } from '@/components/ui/icon/icons';
import { cn } from '@/libs/utils';

import AvatarWithLock from './avatar-with-lock';

export type OwnerInformationCardProps = {
  onProgressComplete: () => void;
  phoneNumber: string;
  isFunnel?: boolean;
};

const PROGRESS_BAR_TOTAL = 100;
const PROGRESS_THRESHOLDS = [95, 20, 65, 45, 80, 5];

const shuffleArray = (array: number[]): number[] => {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

type CollectionStatusProps = {
  isCompleted: boolean;
  label: string;
};

const CollectionStatus = ({ isCompleted, label }: CollectionStatusProps) => {
  return (
    <div className="flex items-center gap-2 lg:gap-2">
      <div className="flex items-center justify-center">
        {isCompleted ? (
          <IconCheckCircle size="large" className="text-secondary" />
        ) : (
          <div className="flex size-6 items-center justify-center">
            <IconLoaderCircle size="medium" className="text-gray-500" />
          </div>
        )}
      </div>
      <span className="text-lg">{label}</span>
    </div>
  );
};

export const OwnerInformationCard = ({
  onProgressComplete,
  phoneNumber,
  isFunnel = false,
}: OwnerInformationCardProps) => {
  const t = useTranslations('pages.reverse_lookup.search_complete.components.owner_information');

  const [progress, setProgress] = useState(0);
  const [randomizedThresholds] = useState(() => shuffleArray(PROGRESS_THRESHOLDS));

  const progressDuration = isFunnel ? 600 : 300;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev === PROGRESS_BAR_TOTAL) {
          clearInterval(interval);
          return PROGRESS_BAR_TOTAL;
        }
        return prev + 1;
      });
    }, progressDuration);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (progress === PROGRESS_BAR_TOTAL) {
      const timer = setTimeout(() => {
        onProgressComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [progress, onProgressComplete]);

  return (
    <section className="rounded-2xl border border-brand-200 bg-green-25 px-4 py-6 lg:p-12">
      <h3 className="w-full">
        {t.rich('title', {
          bold: () => <span className="font-bold whitespace-nowrap">{phoneNumber}</span>,
        })}
      </h3>
      <p className="mt-2 lg:mt-1">{t('subtitle')}</p>
      <div className="mt-4 flex gap-5 lg:mt-8 lg:gap-6">
        <AvatarWithLock />
        <div className="flex w-full flex-col">
          <div
            className={cn(
              'progress-bar relative w-full overflow-hidden',
              isFunnel ? 'progress-bar-60' : 'progress-bar-30',
            )}
          >
            <div className="absolute inset-4 flex items-center justify-end">
              <span className={cn('text-sm font-semibold', progress === PROGRESS_BAR_TOTAL && 'text-white')}>
                {t('progress_bar_percentage', { percentage: progress })}
              </span>
            </div>
          </div>
          <p className="mt-2 text-base">{t('progress_bar_description', { phoneNumber })}</p>
        </div>
      </div>

      <hr className="separator m-0 container-wide mt-4 mb-6 lg:mx-auto lg:my-8 lg:block" />

      <h3 className="w-full">{t('collecting_data_title')}</h3>

      <div className="mt-4 grid gap-4 md:grid-cols-3 lg:mt-6 lg:gap-x-8 lg:gap-y-6">
        <CollectionStatus
          isCompleted={progress > (randomizedThresholds[0] ?? 5)}
          label={t('collecting_data_address')}
        />
        <CollectionStatus
          isCompleted={progress > (randomizedThresholds[1] ?? 20)}
          label={t('collecting_data_profiles')}
        />
        <CollectionStatus
          isCompleted={progress > (randomizedThresholds[2] ?? 45)}
          label={t('collecting_data_online')}
        />
        <CollectionStatus isCompleted={progress > (randomizedThresholds[3] ?? 65)} label={t('collecting_data_job')} />
        <CollectionStatus isCompleted={progress > (randomizedThresholds[4] ?? 80)} label={t('collecting_data_email')} />
        <CollectionStatus isCompleted={progress > (randomizedThresholds[5] ?? 95)} label={t('collecting_data_past')} />
      </div>
    </section>
  );
};
