import { ROUTES } from '@/constants/routes';

type Item = {
  name: string;
  href: string;
};

const mainNavItems: Item[] = [
  { name: 'pricing', href: ROUTES.PRICING },
  { name: 'faqs', href: ROUTES.FAQ },
  { name: 'contact', href: ROUTES.CONTACT },
];

const mobileNavItems: Item[] = [
  { name: 'home', href: ROUTES.HOME },
  { name: 'about_us', href: ROUTES.ABOUT },
  ...mainNavItems,
];

export const getNavigationItems = (viewport: 'mobile' | 'desktop') => {
  if (viewport === 'desktop') {
    return mainNavItems;
  }

  return mobileNavItems;
};
