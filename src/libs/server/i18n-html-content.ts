'use server';

import fs from 'node:fs';
import path from 'node:path';

import { AppConfig } from '@/utils/config';

/**
 * Sanitizes a path segment to prevent path traversal attacks
 */
const sanitizePath = (pathSegment: string | undefined): string | undefined => {
  if (pathSegment === undefined) {
    return undefined;
  }
  return path.normalize(pathSegment).replace(/^(\.\.(\/|\\|$))+/, '');
};

/**
 * Validates that a path is within the allowed base directory
 */
const validatePath = (targetPath: string, basePath: string): void => {
  if (!targetPath.startsWith(basePath)) {
    throw new Error('Access denied: Attempted path traversal');
  }
};

// Get the translated HTML content for a given folder and locale
export const getTranslatedHtml = async (folder: string, locale: string, suffix?: string) => {
  // Sanitize inputs to prevent path traversal
  const sanitizedFolder = sanitizePath(folder);
  const sanitizedLocale = sanitizePath(locale);
  const sanitizedSuffix = sanitizePath(suffix);

  const filename = sanitizedSuffix ? `${sanitizedLocale}_${sanitizedSuffix}` : sanitizedLocale;

  // Construct and validate the full path
  const basePath = path.join(process.cwd(), 'src/locales');
  const targetPath = path.join(basePath, sanitizedFolder!, `${filename}.html`);

  // Ensure the target path is within the expected directory
  validatePath(targetPath, basePath);

  if (fs.existsSync(targetPath)) {
    return fs.readFileSync(targetPath, 'utf8');
  }

  const fallbackFilename = sanitizedSuffix
    ? `${AppConfig.defaultLocale}_${sanitizedSuffix}`
    : AppConfig.defaultLocale;
  const fallbackPath = path.join(basePath, sanitizedFolder!, `${fallbackFilename}.html`);

  validatePath(fallbackPath, basePath);

  return fs.readFileSync(fallbackPath, 'utf8');
};
