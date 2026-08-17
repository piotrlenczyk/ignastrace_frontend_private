import type { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

import { INTERNAL_QUERY_PARAMS, TRACKING_PREFIX } from '@/constants/tracking';
import { sanitizeQueryParams, sanitizeUrl } from '@/utils/sensitive-data-sanitizer';

function searchParamsToRecord(params: URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {};
  params.forEach((value, key) => {
    if (INTERNAL_QUERY_PARAMS.has(key)) {
      return;
    }
    record[key] = value;
  });
  return record;
}

function getSanitizedUrl(request: NextRequest): string {
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  return sanitizeUrl(`${protocol}://${host}${pathname}${search}`);
}

function getDeviceInfo(request: NextRequest): Record<string, string> {
  const userAgentString = request.headers.get('user-agent') || '';
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  return {
    user_agent: userAgentString || 'unknown',
    browser_name: result.browser.name || 'unknown',
    browser_version: result.browser.version || 'unknown',
    device_model: result.device.model || 'unknown',
    device_vendor: result.device.vendor || 'unknown',
    device_type: result.device.type || 'desktop',
    os_name: result.os.name || 'unknown',
    os_version: result.os.version || 'unknown',
  };
}

function getTrackingDataToSet(request: NextRequest): Record<string, string> | null {
  const queryRecord = searchParamsToRecord(request.nextUrl.searchParams);
  const hasQueryParams = Object.keys(queryRecord).length > 0;

  if (!hasQueryParams) {
    return null;
  }

  const sanitizedQuery = sanitizeQueryParams(queryRecord);
  const deviceInfo = getDeviceInfo(request);

  return {
    ...sanitizedQuery,
    ...deviceInfo,
    referrer: request.headers.get('referer') || 'none',
    href: getSanitizedUrl(request),
    tracked_at: String(Date.now()),
  };
}

/**
 * The tracking step of the middleware chain: the marketing parameters a visitor
 * arrived with, stored as cookies on the response the steps before it produced.
 */
export function tracking(request: NextRequest, response: NextResponse): NextResponse {
  const trackingData = getTrackingDataToSet(request);

  if (trackingData) {
    const cookieNames = request.cookies.getAll().map((c) => c.name);
    cookieNames.forEach((name) => {
      if (name.startsWith(TRACKING_PREFIX)) {
        response.cookies.delete(name);
      }
    });

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30);

    Object.entries(trackingData).forEach(([key, value]) => {
      response.cookies.set(`${TRACKING_PREFIX}${key}`, String(value), {
        expires: expiration,
        path: '/',
      });
    });
  }

  return response;
}
