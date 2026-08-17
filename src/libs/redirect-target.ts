import { SiteConfig } from '@/utils/config';

/*
 * A path on this site: one leading slash, no second slash or backslash behind
 * it, and no whitespace. That rules out `//evil.example`, `/\evil.example` and
 * the control characters browsers strip before resolving a URL — the three
 * ways a value in a query parameter turns into somewhere else entirely.
 */
const RELATIVE_PATH = /^\/(?![/\\])\S*$/;

export const isRelativePath = (value: string | null | undefined): value is string =>
  typeof value === 'string' && RELATIVE_PATH.test(value);

/** The redirect parameter's value, or the fallback when it is not a path here. */
export const resolveRedirectTarget = (value: string | null | undefined, fallback: string): string =>
  isRelativePath(value) ? value : fallback;

/**
 * Drops a leading locale segment. The guards record where a visitor was headed
 * exactly as it arrived, prefix and all; next-intl's router puts the prefix
 * back on, so the path has to be handed to it without one.
 */
export const stripLocalePrefix = (path: string): string => {
  const [, segment, ...rest] = path.split('/');

  if (!segment || !(SiteConfig.allLocales as string[]).includes(segment)) {
    return path;
  }

  return `/${rest.join('/')}`;
};
