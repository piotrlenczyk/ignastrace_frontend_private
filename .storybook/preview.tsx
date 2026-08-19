import './preview.css';

import type { Preview } from '@storybook/nextjs-vite';
import { NextIntlClientProvider } from 'next-intl';

import { QueryProvider } from '../src/components/navigation/providers/query-client-provider';
import { SessionProvider } from '../src/contexts/session-context';
import messages from '../src/locales/en.json';
import { SETTINGS_DEFAULTS } from '../src/settings/settings.defaults';
import { SettingsProvider } from '../src/settings/settings.provider';

/*
 * Tailwind only scans `src/**` (src/styles/_init.css, ADR 0001), so nothing in
 * this directory can rely on a utility class existing — the classes here are
 * written as inline custom-property reads instead. Stories themselves live under
 * src/ and use utilities normally.
 */
const preview: Preview = {
  parameters: {
    /*
     * The App Router mocks: `useSearchParams`, `usePathname` and `useRouter`
     * resolve to Storybook's implementations, which is what lets client
     * components like PhoneFieldV2 render outside a Next request.
     */
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Foundations', ['Colors', 'Typography'], 'Components', 'Layouts', 'Sections'],
      },
    },
  },

  /*
   * The app's client providers, in the app's order, minus consent — which no v2
   * component reads. Without the intl provider any component calling
   * `useTranslations` throws; without the query provider and the session
   * provider the language selector's mutation hook does; without the settings
   * provider anything asking what is switched on does. The session is rendered
   * signed out and the settings are the declared defaults, since there is no
   * request here to read either from — a story that needs a member, or a flag
   * turned on, supplies its own provider.
   */
  decorators: [
    (Story) => (
      <QueryProvider>
        <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
          <SessionProvider user={null}>
            <SettingsProvider settings={SETTINGS_DEFAULTS}>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-bg-primary)',
                }}
              >
                <Story />
              </div>
            </SettingsProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </QueryProvider>
    ),
  ],

  tags: ['autodocs'],
};

export default preview;
