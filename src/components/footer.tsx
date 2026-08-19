'use client';

import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';
import { useSettings } from '@/settings/settings.provider';

import { Logotype } from './logotype';

const footerLinks = {
  social: {
    tiktok: 'https://www.tiktok.com/@mobitrace.ad',
    instagram: 'https://www.instagram.com/mobitrace.ad',
    linkedin: 'https://www.linkedin.com/company/mobitrace-ad/',
  },
  links: {
    location_number: ROUTES.HOME,
    about_us: ROUTES.ABOUT,
    pricing: ROUTES.PRICING,
    faqs: ROUTES.FAQ,
    contact: ROUTES.CONTACT,
    login: ROUTES.SIGN_IN,
    cancel_subscription: ROUTES.CANCELLATION,
    'privacy policy': ROUTES.PRIVACY_POLICY,
    terms_and_conditions: ROUTES.TERMS,
    reverse_lookup: ROUTES.REVERSE_LOOKUP.HOME,
  },
};

const footerColumnsDesktop = [
  [
    { key: 'location_number', url: footerLinks.links.location_number },
    { key: 'reverse_lookup', url: footerLinks.links.reverse_lookup },
    { key: 'about_us', url: footerLinks.links.about_us },
    { key: 'pricing', url: footerLinks.links.pricing },
  ],
  [
    { key: 'faqs', url: footerLinks.links.faqs },
    { key: 'contact', url: footerLinks.links.contact },
    { key: 'login', url: footerLinks.links.login },
    { key: 'cancel_subscription', url: footerLinks.links.cancel_subscription },
  ],
  [
    { key: 'privacy policy', url: footerLinks.links['privacy policy'] },
    { key: 'terms_and_conditions', url: footerLinks.links.terms_and_conditions },
  ],
];

const footerColumnsMobile = [
  [
    { key: 'location_number', url: footerLinks.links.location_number },
    { key: 'reverse_lookup', url: footerLinks.links.reverse_lookup },
    { key: 'about_us', url: footerLinks.links.about_us },
    { key: 'pricing', url: footerLinks.links.pricing },
    { key: 'faqs', url: footerLinks.links.faqs },
  ],
  [
    { key: 'contact', url: footerLinks.links.contact },
    { key: 'login', url: footerLinks.links.login },
    { key: 'cancel_subscription', url: footerLinks.links.cancel_subscription },
    { key: 'privacy policy', url: footerLinks.links['privacy policy'] },
    { key: 'terms_and_conditions', url: footerLinks.links.terms_and_conditions },
  ],
];

type FooterLinksKeys = keyof typeof footerLinks.links;

export function Footer() {
  const t = useTranslations('footer');
  const { reverseLookupEnabled } = useSettings();

  return (
    <footer className="s-footer text-weak">
      <div className="s-footer-container">
        <hr className="separator mt-0 [grid-area:se1] md:mb-12" />
        <div className="text-center [grid-area:lgo] sm:text-left">
          <Link href="/" className="inline-block">
            <Logotype />
          </Link>
          <p className="mt-4">{t('description')}</p>
        </div>
        <hr className="separator [grid-area:se2] md:mt-12" />

        {/* Mobile layout */}
        <div className="grid grid-cols-2 gap-8 text-sm [grid-area:lnk] lg:hidden">
          {footerColumnsMobile.map((column, columnIndex) => (
            <ul key={columnIndex} className="space-y-2">
              {column.map(({ key, url }) =>
                !reverseLookupEnabled && key === 'reverse_lookup' ? null : (
                  <li key={key}>
                    <Link href={url} className="hover:underline">
                      {t(`links.${key as FooterLinksKeys}`)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          ))}
        </div>

        {/* Desktop layout */}
        <div className="hidden grid-cols-3 gap-8 text-sm [grid-area:lnk] lg:grid">
          {footerColumnsDesktop.map((column, columnIndex) => (
            <ul key={columnIndex} className="space-y-2">
              {column.map(({ key, url }) =>
                !reverseLookupEnabled && key === 'reverse_lookup' ? null : (
                  <li key={key}>
                    <Link href={url} className="hover:underline">
                      {t(`links.${key as FooterLinksKeys}`)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          ))}
        </div>

        <hr className="separator [grid-area:se3] md:hidden" />
        <p className="mb-6 text-center text-sm [grid-area:cop] sm:text-left">
          &copy; {new Date().getFullYear()} Mobitrace.io. {t('rights')}
        </p>
      </div>
    </footer>
  );
}
