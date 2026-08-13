import type { routing } from '@/libs/i18n-routing';
import type messages from '@/locales/en.json';

/*
 * next-intl v4 reads its `Locale` and `Messages` types out of an `AppConfig`
 * interface declared here, which is what makes `t('...')` keys and `locale`
 * values type-checked rather than plain strings. It has to be an interface: the
 * library declares `AppConfig` itself, and only interfaces merge across
 * declarations.
 *
 * Not to be confused with the site's own locale and currency settings — those
 * live in `@/utils/config` and are exported as `SiteConfig` precisely so the
 * two never share a name again.
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
    // Formats: typeof formats;
  }
}
