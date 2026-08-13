import { useTranslations } from 'next-intl';

import RecentLookups from './recentLookups';

const RecentReveals = ({ country }: { country: string }) => {
  const t = useTranslations('pages.reverse_lookup.components.recent_reveals');

  return (
    <div className="px-4 py-8 md:py-20 lg:px-0">
      <div className="flex flex-col items-center justify-center gap-1">
        <h3 className="font-bold">{t('title')}</h3>
        <p className="mt-8 text-center text-lg text-weak md:mt-0">{t('subtitle')}</p>
      </div>
      <RecentLookups originCountry={country} />
    </div>
  );
};

export default RecentReveals;
