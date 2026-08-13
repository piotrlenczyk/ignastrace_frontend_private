import { useTranslations } from 'next-intl';

import { Link } from '@/libs/i18n-routing';

import { getNavigationItems } from '../helpers/main-navigation';

export const DesktopMainNavigation = () => {
  const t = useTranslations('navigation');

  const items = getNavigationItems('desktop');
  return (
    <ul className="flex">
      {items.map((item) => (
        <li key={item.name} className="px-4 font-semibold text-weak hover:text-strong">
          <Link href={item.href}>{t(item.name as any)}</Link>
        </li>
      ))}
    </ul>
  );
};
