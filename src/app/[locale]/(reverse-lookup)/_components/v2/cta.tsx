import type { CountryCode } from 'libphonenumber-js';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';

import { LookupForm } from './lookup-form';

/*
 * "Look up any phone number now!" — CTA section 13002:132174.
 *
 * The panel fill is `bg-brand-solid-section` (primary-800). That is sampled from
 * the export rather than inferred: the frame binds both `bg-brand-solid` (600,
 * #1570ef) and `bg-brand-solid-section` (800, #1849a9) and the panel is the darker
 * of the two — #1849a9 at pixel (300, 6300).
 *
 * The dotted world map behind the copy is not implemented — see the note in the
 * report. It is a decorative pattern layer inside the CTA symbol and needs its own
 * export; the panel renders as flat brand-800 until then.
 *
 * The form is the same `LookupForm` as the hero, so the submit path stays in one
 * place. Its own default destination applies.
 */
export const Cta = ({ defaultCountry }: { defaultCountry: CountryCode }) => {
  const t = useTranslations('__NEW__.reverse_lookup.cta');
  const hero = useTranslations('__NEW__.reverse_lookup.hero');

  return (
    <section className="bg-bg-secondary px-4 py-12 lg:px-8 lg:py-16">
      <div
        className={`
          mx-auto flex max-w-[1376px] flex-col items-center gap-6 rounded-2xl bg-bg-brand-solid-section px-4 py-12
          lg:px-8 lg:py-20
        `}
      >
        <div className="flex max-w-[768px] flex-col gap-4 text-center">
          <h2 className="font-display text-display-sm-medium text-text-primary-on-brand lg:text-display-md-medium">
            {t('title')}
          </h2>
          <p className="font-body text-md-regular text-text-primary-on-brand lg:text-lg-regular">{t('subtitle')}</p>
        </div>

        <div className="flex w-full max-w-[640px] flex-col items-center gap-3">
          <LookupForm defaultCountry={defaultCountry} />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-body text-sm-medium text-text-primary-on-brand">{hero('rating')}</span>
              <Icon name="star" className="size-5" aria-label={hero('rating_label')} />
            </div>
            <span className="h-2 w-px bg-alpha-white-30" aria-hidden />
            <p className="font-body text-sm-regular text-text-primary-on-brand">
              {hero.rich('trusted_by', { strong: (chunks) => <span className="text-sm-semibold">{chunks}</span> })}
            </p>
            <span className="h-2 w-px bg-alpha-white-30" aria-hidden />
            <p className="font-body text-sm-regular text-text-primary-on-brand">{hero('confidential')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
