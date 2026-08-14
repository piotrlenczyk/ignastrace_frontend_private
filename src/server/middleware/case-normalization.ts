import { type NextRequest, NextResponse } from 'next/server';

export const caseNormalization = (request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const lowercasePathname = pathname.toLowerCase();

  if (pathname !== lowercasePathname) {
    const url = request.nextUrl.clone();
    url.pathname = lowercasePathname;
    return NextResponse.redirect(url, 308);
  }

  return null;
};
