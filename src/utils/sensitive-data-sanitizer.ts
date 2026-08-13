const SENSITIVE_QUERY_KEYS = new Set(['token', 'signInToken', 'code', 'confirmationCode']);

const MASK_PLACEHOLDER = '*****';

function isSensitiveKey(key: string): boolean {
  for (const sensitiveKey of SENSITIVE_QUERY_KEYS) {
    if (key.toLowerCase() === sensitiveKey.toLowerCase()) {
      return true;
    }
  }

  return false;
}

export function sanitizeQueryParam(key: string, value: string): string {
  if (isSensitiveKey(key)) {
    return MASK_PLACEHOLDER;
  }

  return value;
}

export function sanitizeQueryParams(query: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  Object.entries(query).forEach(([key, value]) => {
    sanitized[key] = sanitizeQueryParam(key, value);
  });

  return sanitized;
}

export function sanitizeUrl(href: string): string {
  try {
    const urlObj = new URL(href);
    const originalParams = new URLSearchParams(urlObj.search);
    const sanitizedParams = new URLSearchParams();

    originalParams.forEach((value, key) => {
      const sanitizedValue = sanitizeQueryParam(key, value);
      sanitizedParams.set(key, sanitizedValue);
    });

    urlObj.search = sanitizedParams.toString();
    return urlObj.toString();
  } catch {
    return href;
  }
}
