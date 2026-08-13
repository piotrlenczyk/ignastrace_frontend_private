import { ROUTES } from '@/constants/routes';

/*
 * Literal rather than `string` so `t(item.name)` type-checks against the
 * `__NEW__.navigation` namespace. The legacy nav helper reached for `t(name as any)`
 * to get past this; the project bars `any`, and the union is also what makes a
 * missing translation key a compile error rather than a runtime dash.
 */
type NavItemName = 'about_us' | 'pricing' | 'faqs' | 'contact';

type NavItem = {
  /** Key under the `__NEW__.navigation` namespace. */
  name: NavItemName;
  href: string;
};

/*
 * The new design's information architecture, which is not the legacy one:
 * the desktop header gains "About us" (the legacy desktop nav had only
 * pricing/faqs/contact) and the mobile menu drops "Home" and reorders
 * Contact us above Pricing. Both lists are read straight off the Figma frames
 * (13002:219861 desktop, 13019:50411 mobile menu) rather than carried over, so
 * they are kept here instead of in helpers/main-navigation.ts — that file still
 * feeds every screen not yet rebuilt.
 */
export const desktopNavItems: NavItem[] = [
  { name: 'about_us', href: ROUTES.ABOUT },
  { name: 'pricing', href: ROUTES.PRICING },
  { name: 'faqs', href: ROUTES.FAQ },
  { name: 'contact', href: ROUTES.CONTACT },
];

export const mobileNavItems: NavItem[] = [
  { name: 'about_us', href: ROUTES.ABOUT },
  { name: 'contact', href: ROUTES.CONTACT },
  { name: 'pricing', href: ROUTES.PRICING },
  { name: 'faqs', href: ROUTES.FAQ },
];
