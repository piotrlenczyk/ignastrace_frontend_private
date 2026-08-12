import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import puppeteer, { type Page } from 'puppeteer';

const pdfStyles = `
  @media print {
    .border.bg-card {
      border: none !important;
      box-shadow: none !important;
      page-break-inside: avoid;
      box-shadow: none !important;
      background-color: transparent !important;
      padding: 0 !important;
    }

    .border.bg-card h4 {
      margin-top: 24px !important;
    }

    body {
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
  }
`;

function disableLazyLoading(page: Page) {
  page.evaluate(() => {
    const images = document.querySelectorAll('img[loading="lazy"]') as NodeListOf<HTMLImageElement>;
    images.forEach((img) => {
      img.setAttribute('loading', 'eager');
      const src = img.src;
      img.src = '';
      img.src = src;
    });
  });
}

function disableLinks(page: Page) {
  page.evaluate(() => {
    const noClickElements = document.querySelectorAll('.print-remove-link');
    noClickElements.forEach((element) => {
      if (element.tagName === 'A') {
        element.removeAttribute('href');
      }
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { url, filename } = requestData;
    const cookies = request.headers.get('cookie');

    // Use PDF_GENERATION_APP_HOST as host if defined. This is to avoid an incorrect url because of request headers.
    let targetUrl = url;

    if (process.env.PDF_GENERATION_APP_HOST) {
      const originalUrl = new URL(url);
      const hostUrl = new URL(process.env.PDF_GENERATION_APP_HOST);
      targetUrl = `${hostUrl.protocol}//${hostUrl.host}${originalUrl.pathname}${originalUrl.search}${originalUrl.hash}`;
    }

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: isProduction ? '/usr/bin/chromium' : undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        ...(isProduction ? ['--no-zygote', '--single-process'] : []),
      ],
    });

    const page = await browser.newPage();

    if (cookies) {
      // Seed the browser cookie jar (not just the navigation header). Chromium
      // applies setExtraHTTPHeaders' Cookie only to the top-level navigation;
      // same-origin fetch/RSC requests fired after the page loads are served
      // from the cookie jar. Without seeding it, those secondary requests go out
      // WITHOUT the auth cookie -> the server treats them as unauthenticated and
      // redirects to "/", so the captured PDF is the homepage.
      const targetOrigin = new URL(targetUrl).origin;
      const jarCookies = cookies
        .split(';')
        .map((pair) => {
          const eq = pair.indexOf('=');
          const name = pair.slice(0, eq).trim();
          const value = pair.slice(eq + 1).trim();
          return {
            name,
            value,
            url: targetOrigin,
            secure: name.startsWith('__Secure-') || name.startsWith('__Host-'),
          };
        })
        .filter(cookie => cookie.name && cookie.value);

      await page.setCookie(...jarCookies);
    }

    await page.goto(targetUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await disableLazyLoading(page);

    await disableLinks(page);

    await page.addStyleTag({
      content: pdfStyles,
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      displayHeaderFooter: true,
      headerTemplate: '',
      footerTemplate: '',
    });

    await browser.close();

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'mobitrace.pdf'}"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    );
  }
}
