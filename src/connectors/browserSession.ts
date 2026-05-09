import puppeteer, { Browser, Page } from 'puppeteer';
import { log } from '../utils/logger';

export interface StoredCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expiry?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

/**
 * Launch a Chromium browser instance with Railway-compatible settings.
 * Puppeteer includes Chromium and works reliably on Railway without Dockerfile.
 */
export async function buildBrowser(): Promise<Browser> {
  const isDev = process.env.NODE_ENV === 'development';
  const headless = process.env.PUPPETEER_HEADLESS !== 'false';

  const launchOptions: any = {
    headless: headless ? 'new' : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-resources',
      '--disable-default-apps',
    ],
    // Use custom Chromium path if provided, otherwise let Puppeteer use bundled version
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  };

  if (isDev) {
    log.info('browser.launch', { headless, isDev });
  }

  return puppeteer.launch(launchOptions);
}

/**
 * Get the browser timeout (default 15 seconds).
 */
export function getBrowserTimeout(): number {
  return Number(process.env.BROWSER_TIMEOUT_MS ?? '15000');
}

/**
 * Wait for page to fully load.
 */
export async function waitForPageLoad(page: Page, timeoutMs: number): Promise<void> {
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: timeoutMs }).catch(() => {
    // Navigation may have already completed
  });
}

/**
 * Extract cookies from the current page.
 */
export async function extractCookies(page: Page): Promise<StoredCookie[]> {
  const cookies = await page.cookies();
  return cookies.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expiry: c.expires,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
  }));
}

/**
 * Inject cookies into a page before navigation.
 * Page must navigate to the cookie's domain first.
 */
export async function injectSessionCookies(page: Page, baseUrl: string, cookies: StoredCookie[]): Promise<void> {
  // Navigate to base domain first so cookies can be set
  await page.goto(baseUrl, { waitUntil: 'networkidle2' }).catch(() => {});

  // Convert back to Puppeteer cookie format and set them
  for (const cookie of cookies) {
    try {
      await page.setCookie({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        expires: cookie.expiry,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: (cookie.sameSite as any) || 'Lax',
      });
    } catch {
      // Skip cookies that can't be set (wrong domain, expired, etc.)
    }
  }
}

/**
 * Create a new page with sensible defaults.
 */
export async function createPage(browser: Browser): Promise<Page> {
  const page = await browser.newPage();

  // Set a realistic viewport
  await page.setViewport({ width: 1280, height: 720 });

  // Set user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  return page;
}
