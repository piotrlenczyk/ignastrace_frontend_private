import Image from 'next/image';
import { useTranslations } from 'next-intl';

/*
 * "Get the full report with Ignastrace" — Features section 13002:131872.
 *
 * Geometry is read off the frame: a 3x2 grid of 458.67x256 cells inside a 1376
 * container, 48px icon block, 96px section padding. The cells are borderless in
 * themselves — the rules are the grid's, drawn with `border-r`/`border-b` per cell
 * plus a top/left edge on the container, which keeps them 1px rather than doubling
 * where two cells meet.
 *
 * The six glyphs are the design's own exported SVGs. They are `stroke="white"` and
 * trimmed to their path bounds (so 21.5x17.5 rather than 24x24), which is why they
 * are committed assets rendered at natural size inside a 24px box instead of going
 * through `generate:icons` — that generator forces width and height to the same
 * size token and would squash a non-square glyph.
 *
 * The Figma cells each contain a `Buttons/Button` instance marked hidden, so no
 * per-cell link is rendered here.
 */

const items = [
  { key: 'owner_details', icon: 'owner-details.svg', w: 21.5, h: 17.5 },
  { key: 'relationships', icon: 'relationships.svg', w: 21.5, h: 17.5 },
  { key: 'contact_info', icon: 'contact-info.svg', w: 20.5, h: 21.5 },
  { key: 'social_media', icon: 'social-media.svg', w: 21.5, h: 20.5 },
  { key: 'location', icon: 'location.svg', w: 17.5, h: 21.5 },
  { key: 'other_info', icon: 'other-info.svg', w: 21.5, h: 19.5 },
] as const;

export const FullReport = () => {
  const t = useTranslations('__NEW__.reverse_lookup.full_report');

  return (
    <section className="bg-bg-secondary px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1376px]">
        <div className="mx-auto flex max-w-[768px] flex-col gap-5 text-center">
          <h2 className="font-display text-display-sm-medium text-text-primary lg:text-display-md-medium">
            {t('title')}
          </h2>
          <p className="font-body text-md-regular text-text-tertiary lg:text-lg-regular">{t('subtitle')}</p>
        </div>

        <ul
          className={`
            mt-10 grid grid-cols-1 border-t border-l border-border-secondary
            sm:grid-cols-2
            lg:mt-12 lg:grid-cols-3
          `}
        >
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-col items-center border-r border-b border-border-secondary px-8 py-12 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-bg-brand-solid">
                <Image
                  src={`/images/reverse-lookup/features/${item.icon}`}
                  alt=""
                  width={item.w}
                  height={item.h}
                  aria-hidden
                />
              </span>
              <h3 className="mt-6 font-display text-display-xs-medium text-text-primary">{t(`${item.key}.title`)}</h3>
              <p className="mt-2 font-body text-md-regular text-text-tertiary">{t(`${item.key}.description`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
