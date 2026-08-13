import '@/styles/application.css';

import type { Metadata } from 'next';
import { Bebas_Neue, Inter } from 'next/font/google';
import Script from 'next/script';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import {
  getLocale,
  getMessages,
  getTranslations,
  setRequestLocale,
} from 'next-intl/server';

import { auth } from '@/auth';
import { QueryProvider } from '@/components/navigation/providers/query-client-provider';
import { Toaster } from '@/components/ui/toaster';
import { ConsentProvider } from '@/contexts/consent-context';
import { CountryProvider } from '@/contexts/country-context';
import { FeaturesProvider } from '@/contexts/features-context';
import { getFeatures } from '@/libs/server/feature-flags';
import { getUserCountry } from '@/libs/server/user-country';
import { cn } from '@/libs/utils';
import { getAlternates, getBaseUrl, getCurrentPath } from '@/utils/helpers';

const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const bebasFont = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  weight: ['400'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();

  const t = await getTranslations({
    locale,
    namespace: 'pages.index',
  });

  const baseUrl = getBaseUrl();
  const alternates = await getAlternates();
  const currentPath = await getCurrentPath();

  const metadata = {
    title: t('meta_title'),
    description: t('meta_description'),
    applicationName: t('site_name'),
    metadataBase: new URL(baseUrl),
    alternates,
    openGraph: {
      title: t('og_title'),
      description: t('og_description'),
      siteName: t('site_name'),
      locale,
      type: 'website',
      url: currentPath,
      images: [
        {
          url: '/images/og-image.jpg',
          alt: t('og_image_alt'),
          width: 1200,
          height: 630,
          type: 'image/jpeg',
        },
      ],
    },

    manifest: '/site.webmanifest',
    appleWebApp: {
      title: t('site_name'),
    },
    robots: {
      index: false,
      follow: true,
    },
    icons: [
      {
        rel: 'apple-touch-icon',
        url: '/apple-touch-icon.png',
        sizes: '180x180',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/web-app-manifest-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/web-app-manifest-512x512.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '96x96',
        url: '/favicon-96x96.png',
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        sizes: '64x64 32x32 24x24 16x16',
        url: '/favicon.ico',
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        sizes: 'any',
        url: '/favicon.svg',
      },
    ],
  };

  return metadata;
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const locale = await getLocale();
  setRequestLocale(locale);

  const messages = await getMessages();
  const session = await auth();
  const country = await getUserCountry();
  const features = await getFeatures();
  const isUSUser = country === 'US';
  const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.
  return (
    <html
      lang={locale}
      // Next 16 no longer forces `scroll-behavior: auto` during client-side
      // navigation, and _base.css sets `scroll-behavior: smooth` globally.
      // Without this opt-in, every route change would animate a scroll to the
      // top instead of jumping there. In-page anchors stay smooth either way.
      data-scroll-behavior="smooth"
      className={cn(interFont.variable, bebasFont.variable)}
    >
      <head>
        {/* begin Convert Experiences code */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="text/javascript"
          src="//cdn-4.convertexperiments.com/v1/js/10048246-100418060.js?environment=production"
        />
        {/* end Convert Experiences code */}

        <meta name="theme-color" content="#FFFFFF" />
        <script
          data-domain="mobitrace.io"
          src="https://plausible.io/js/script.js"
          defer
        />
        {GTM_ID && (
          <Script id="gtm-script" strategy="afterInteractive">
            {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
            `}
          </Script>
        )}
      </head>
      <body suppressHydrationWarning>
        <SessionProvider session={session}>
          <QueryProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <CountryProvider country={country}>
                <FeaturesProvider features={features}>
                  <ConsentProvider isUSUser={isUSUser}>
                    {props.children}
                    <Toaster />
                  </ConsentProvider>
                </FeaturesProvider>
              </CountryProvider>
            </NextIntlClientProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

// force deploy 3
