'use server';

import { headers } from 'next/headers';

export async function getIP() {
  const _headers = await headers();

  // Cloudflare provides real client IP in CF-Connecting-IP header
  const cfConnectingIp = _headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to X-Forwarded-For for other proxies
  const forwardedFor = _headers.get('x-forwarded-for');
  return forwardedFor ? forwardedFor.split(',')[0] : null;
}

export async function getIPCountry() {
  const _headers = await headers();
  return _headers.get('cf-ipcountry');
}
