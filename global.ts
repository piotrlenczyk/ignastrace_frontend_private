import type { routing } from '@/libs/i18n-routing';
import type messages from '@/locales/en.json';

declare module 'next-intl' {
  type AppConfig = {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
    // Formats: typeof formats;
  };
}
