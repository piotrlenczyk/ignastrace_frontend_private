import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/constants/routes';
import { Link } from '@/libs/i18n-routing';

/*
 * The new-design footer — `Footer` (13002:2796 desktop, 13002:2837 mobile).
 *
 * A new component rather than a restyle of components/footer.tsx: that one is
 * rendered by `WebsiteLayout` for every screen still on the legacy design, and its
 * link groups differ from this design's four columns.
 *
 * The set draws no fill of its own — only the top hairline — so the footer takes
 * the page surface rather than `bg-secondary`.
 *
 * Copyright and disclaimer are one block below the columns, spanning the full
 * width, not part of the logo column: the design groups them as `Ligal` (sic) with
 * 24px between them and 32px above.
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
    <footer className="border-t border-border-secondary-alt px-4 py-10 lg:px-8 lg:pt-16 lg:pb-12">
      <div className="mx-auto flex max-w-[1376px] flex-col gap-8">
        {/* Desktop wraps at 48px rather than shrinking the 320px logo column. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between lg:gap-y-12">
          <div className="flex max-w-[320px] flex-col gap-5 lg:min-w-[320px] lg:gap-8">
            <Link href={ROUTES.HOME} aria-label={t('home_aria')}>
              <Image src="/images/ignastrace-logotype.svg" width={124} height={26} alt="IgnasTrace.io" />
            </Link>
            <p className="font-body text-md-regular text-text-tertiary">{t('tagline')}</p>
          </div>

          {/* Two columns on mobile at 32px; four in a row on desktop at 80px. */}
          <div className="grid grid-cols-2 gap-8 lg:flex lg:gap-20">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <h2 className="font-body text-xs-semibold text-text-disabled uppercase">{t(column.title)}</h2>
                <ul className="flex flex-col gap-3 lg:w-40">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="font-body text-md-medium text-text-tertiary hover:text-text-tertiary-hover"
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

        <div className="flex flex-col gap-6 font-body text-sm-regular text-text-quaternary">
          <p>{t('copyright')}</p>
          <p>
            {t('disclaimer')}{' '}
            <Link href={ROUTES.TERMS} className="underline hover:text-text-tertiary">
              {t('read_more')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};
