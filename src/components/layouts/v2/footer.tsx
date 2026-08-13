import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';

/*
 * Footer 13021:40003.
 *
 * A new component rather than a restyle of components/footer.tsx: that one is
 * rendered by `WebsiteLayout` for every screen still on the legacy design, and its
 * link groups differ from this design's four columns.
 *
 * Two notes on the disclaimer. The frame truncates it with a "read more" affordance,
 * and the legacy footer has no disclaimer at all — so there is no full copy to
 * recover, and only the visible sentence is in the locale file. The affordance is
 * rendered as a link to Terms rather than an expand toggle, because an expanding
 * disclaimer is behaviour this page does not currently have.
 */

/*
 * Keys are spelled out per link rather than composed as `${column}.${link}`. That
 * template form types out to the cross-product of every column with every link, so
 * `tools.home` and `legal.cancel_subscription` become candidate keys and next-intl
 * rejects the lot. Full literals keep each key checked against the real namespace.
 */
const columns = [
  {
    title: 'tools.title',
    links: [
      { label: 'tools.location_by_number', href: ROUTES.HOME },
      { label: 'tools.reverse_lookup', href: ROUTES.REVERSE_LOOKUP.HOME },
    ],
  },
  {
    title: 'about.title',
    links: [
      { label: 'about.home', href: ROUTES.HOME },
      { label: 'about.about_us', href: ROUTES.ABOUT },
      { label: 'about.pricing', href: ROUTES.PRICING },
      { label: 'about.login', href: ROUTES.SIGN_IN },
    ],
  },
  {
    title: 'support.title',
    links: [
      { label: 'support.contact', href: ROUTES.CONTACT },
      { label: 'support.faqs', href: ROUTES.FAQ },
      { label: 'support.cancel_subscription', href: ROUTES.CANCELLATION },
    ],
  },
  {
    title: 'legal.title',
    links: [
      { label: 'legal.terms', href: ROUTES.TERMS },
      { label: 'legal.privacy', href: ROUTES.PRIVACY_POLICY },
      { label: 'legal.cookies', href: ROUTES.COOKIE_POLICY },
    ],
  },
] as const;

export const FooterV2 = () => {
  const t = useTranslations('__NEW__.footer');

  return (
    <footer className="border-t border-border-secondary bg-bg-secondary px-4 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1376px]">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex max-w-[320px] flex-col gap-6">
            <Link href={ROUTES.HOME} aria-label={t('home_aria')}>
              <Image src="/images/ignastrace-logotype.svg" width={124} height={26} alt="IgnasTrace.io" />
            </Link>
            <p className="font-body text-md-regular text-text-tertiary">{t('tagline')}</p>
            <p className="font-body text-sm-regular text-text-quaternary">{t('copyright')}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-16">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <h2 className="font-body text-sm-semibold text-text-quaternary uppercase">{t(column.title)}</h2>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="font-body text-md-regular text-text-tertiary hover:text-text-tertiary-hover"
                      >
                        {t(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-12 font-body text-sm-regular text-text-quaternary">
          {t('disclaimer')}{' '}
          <Link href={ROUTES.TERMS} className="underline hover:text-text-tertiary">
            {t('read_more')}
          </Link>
        </p>
      </div>
    </footer>
  );
};
