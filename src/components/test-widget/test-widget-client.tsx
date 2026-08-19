'use client';

import { deleteCookie, getCookie, setCookie } from 'cookies-next/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DEV_COUNTRY_COOKIE_NAME } from '@/constants/countries';
import { cn } from '@/libs/utils';
import { PAYMENTS_OVERRIDE_COOKIE_PREFIX } from '@/network/payments-api/payments-api-override-cookies';
import { type OverridableSetting, SETTINGS_OVERRIDE_COOKIES } from '@/settings/settings.cookies';
import type { Settings } from '@/settings/settings.types';

/*
 * The panel itself.
 *
 * Its copy is written in place rather than in `en.json`: it is a tool for whoever
 * is testing the application, never part of what a visitor is served, and a
 * locale file is for the product's words.
 *
 * Every control writes a cookie and refreshes the route. The cookies are the
 * interface — the settings are settled on the server, and the payments overrides
 * are read by the payments service itself — so nothing here holds state that the
 * next server render will not agree with.
 */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** The settings a cookie may speak for, in the order they are shown. */
const OVERRIDABLE_SETTINGS = Object.keys(SETTINGS_OVERRIDE_COOKIES) as OverridableSetting[];

/**
 * The payments overrides, as resumewise's widget lists them.
 *
 * These are not this application's flags: the proxy forwards any `payments_`
 * cookie upstream with the prefix taken off, and the payments service is what
 * honours them. The list is therefore a convenience over a rule — a name the
 * service learns later still works, it just has no row here.
 */
const PAYMENTS_OVERRIDES: { key: string; label: string; options?: string[] }[] = [
  { key: 'paymentProvider', label: 'Payment provider', options: ['stripe', 'nmi', 'adyen'] },
  { key: 'trialDays', label: 'Trial days', options: ['1', '7', '14'] },
  { key: 'splitPayment', label: 'Split payment', options: ['true', 'false'] },
  { key: 'paypalDisabled', label: 'PayPal disabled', options: ['true', 'false'] },
  { key: 'adyenForceTestAcquirerResponseCode', label: 'Adyen test response code' },
];

const paymentsCookieName = (key: string) => `${PAYMENTS_OVERRIDE_COOKIE_PREFIX}${key}`;

/** Every cookie the panel reads or writes. */
const WATCHED_COOKIES = [
  ...Object.values(SETTINGS_OVERRIDE_COOKIES),
  DEV_COUNTRY_COOKIE_NAME,
  ...PAYMENTS_OVERRIDES.map(({ key }) => paymentsCookieName(key)),
];

const readCookies = () =>
  Object.fromEntries(WATCHED_COOKIES.map((name) => [name, getCookie(name)?.toString()])) as Record<
    string,
    string | undefined
  >;

const humanise = (setting: string) =>
  setting
    .replace(/Enabled$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase());

const rowClasses = 'flex items-center justify-between gap-2 py-1';
const labelClasses = 'text-xs-medium text-text-secondary';
const fieldClasses =
  'min-w-0 flex-1 rounded-sm border border-border-secondary bg-bg-primary px-1.5 py-1 text-xs-regular text-text-primary';

export const TestWidgetClient = ({ settings, version }: { settings: Settings; version: string }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  /*
   * Read when the panel is opened rather than while rendering: `document.cookie`
   * does not exist on the server, and a first client paint that disagreed with
   * the markup it hydrates would be a hydration error. Opening is a click, so by
   * then there is a document to read.
   */
  const [cookies, setCookies] = useState<Record<string, string | undefined>>({});

  const open = () => {
    setCookies(readCookies());
    setIsOpen(true);
  };

  const write = (name: string, value: string | null) => {
    if (value === null || value === '') {
      deleteCookie(name, { path: '/' });
    } else {
      setCookie(name, value, { path: '/', maxAge: COOKIE_MAX_AGE });
    }

    setCookies(readCookies());
    router.refresh();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={open}
        className="
          fixed right-4 bottom-4 z-50 rounded-full bg-bg-brand-solid px-3 py-2 font-body text-xs-semibold
          text-text-primary-on-brand shadow-uui-xs
        "
      >
        QA
      </button>
    );
  }

  return (
    <aside
      className="
        fixed right-4 bottom-4 z-50 flex max-h-[80vh] w-80 flex-col overflow-y-auto rounded-lg border
        border-border-secondary bg-bg-primary p-3 font-body shadow-uui-xs
      "
    >
      <header className="flex items-center justify-between pb-2">
        <span className="text-sm-semibold text-text-primary">QA settings</span>
        <button type="button" onClick={() => setIsOpen(false)} className="text-xs-medium text-text-tertiary">
          Close
        </button>
      </header>

      <section className="border-t border-border-secondary py-2">
        <h3 className="pb-1 text-xs-semibold text-text-primary">Flags</h3>
        {OVERRIDABLE_SETTINGS.map((setting) => {
          const cookieName = SETTINGS_OVERRIDE_COOKIES[setting];
          const override = cookies[cookieName];

          return (
            <div key={setting} className={rowClasses}>
              <span className={labelClasses}>
                {humanise(setting)}
                <span className={cn('pl-1', settings[setting] ? 'text-text-success-primary' : 'text-text-tertiary')}>
                  {settings[setting] ? 'on' : 'off'}
                </span>
              </span>
              <span className="flex shrink-0 gap-1">
                {(
                  [
                    ['On', '1'],
                    ['Off', '0'],
                    ['Source', null],
                  ] as const
                ).map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => write(cookieName, value)}
                    className={cn(
                      'rounded-sm border border-border-secondary px-1.5 py-0.5 text-xs-regular',
                      (override ?? null) === value
                        ? 'bg-bg-brand-solid text-text-primary-on-brand'
                        : 'bg-bg-primary text-text-tertiary',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </section>

      <section className="border-t border-border-secondary py-2">
        <h3 className="pb-1 text-xs-semibold text-text-primary">Country</h3>
        <div className={rowClasses}>
          <span className={labelClasses}>Asking from {settings.countryCode}</span>
          <input
            aria-label="Country override"
            defaultValue={cookies[DEV_COUNTRY_COOKIE_NAME] ?? ''}
            placeholder="e.g. GB"
            onBlur={(event) => write(DEV_COUNTRY_COOKIE_NAME, event.target.value.trim().toUpperCase())}
            className={cn(fieldClasses, 'max-w-20')}
          />
        </div>
      </section>

      <section className="border-t border-border-secondary py-2">
        <h3 className="pb-1 text-xs-semibold text-text-primary">Payments service</h3>
        {PAYMENTS_OVERRIDES.map(({ key, label, options }) => {
          const cookieName = paymentsCookieName(key);

          return (
            <div key={key} className={rowClasses}>
              <span className={labelClasses}>{label}</span>
              {options ? (
                <select
                  aria-label={label}
                  value={cookies[cookieName] ?? ''}
                  onChange={(event) => write(cookieName, event.target.value)}
                  className={cn(fieldClasses, 'max-w-28')}
                >
                  <option value="">not set</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  aria-label={label}
                  defaultValue={cookies[cookieName] ?? ''}
                  onBlur={(event) => write(cookieName, event.target.value.trim())}
                  className={cn(fieldClasses, 'max-w-28')}
                />
              )}
            </div>
          );
        })}
      </section>

      <footer className="border-t border-border-secondary pt-2 text-xs-regular text-text-tertiary">v{version}</footer>
    </aside>
  );
};
