import './preview.css';

import type { Preview } from '@storybook/nextjs-vite';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';

import { QueryProvider } from '../src/components/navigation/providers/query-client-provider';
import messages from '../src/locales/en.json';

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
   * The app's client providers, in the app's order, minus the ones no v2
   * component reads (country, features, consent). Without the intl provider any
   * component calling `useTranslations` throws; without the session and query
   * providers the language selector's mutation hook does. `session={null}`
   * renders the signed-out state and stops NextAuth from calling an API route
   * that does not exist here.
   */
  decorators: [
    (Story) => (
      <SessionProvider session={null} refetchOnWindowFocus={false}>
        <QueryProvider>
          <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
            <div
              style={{
                fontFamily: 'var(--font-body)',
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-primary)',
              }}
            >
              <Story />
            </div>
          </NextIntlClientProvider>
        </QueryProvider>
      </SessionProvider>
    ),
  ],

  tags: ['autodocs'],
};

export default preview;
