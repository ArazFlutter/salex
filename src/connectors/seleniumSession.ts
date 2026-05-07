import 'chromedriver';

import { Builder, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import {
  loadSession,
  saveSession,
  invalidateSession,
  type StoredCookie,
  type PlatformSession,
} from '../services/platformSessionService';
import type { PlatformId } from '../utils/platforms';

export function buildChromeOptions(envPrefix: string): chrome.Options {
  const options = new chrome.Options();
  const headless = process.env[`${envPrefix}_SELENIUM_HEADLESS`] !== 'false';
  const chromeBinary = process.env.CHROME_BIN?.trim();

  if (headless) {
    options.addArguments('--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage');
  }

  if (chromeBinary) {
    options.setChromeBinaryPath(chromeBinary);
  }

  return options;
}

export function getSeleniumTimeout(envPrefix: string): number {
  return Number(process.env[`${envPrefix}_SELENIUM_TIMEOUT_MS`] ?? '15000');
}

export async function buildChromeDriver(envPrefix: string): Promise<WebDriver> {
  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(buildChromeOptions(envPrefix))
    .build();
}

export async function waitForPageLoad(driver: WebDriver, timeoutMs: number): Promise<void> {
  await driver.wait(async () => {
    const readyState = await driver.executeScript('return document.readyState');
    return readyState === 'complete';
  }, timeoutMs);
}

export async function extractCookies(driver: WebDriver): Promise<StoredCookie[]> {
  const raw = await driver.manage().getCookies();
  return raw.map((c) => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expiry: typeof c.expiry === 'number' ? c.expiry : undefined,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite,
  }));
}

/**
 * Loads a stored session from the DB and injects cookies into the driver.
 * The driver must navigate to the base domain first so cookies can be set.
 * Returns the loaded session (or null if none / invalid).
 */
export async function injectSessionCookies(
  driver: WebDriver,
  baseUrl: string,
  userId: string,
  platformId: PlatformId,
): Promise<PlatformSession | null> {
  const session = await loadSession(userId, platformId);

  if (!session || !session.sessionValid || session.cookies.length === 0) {
    return null;
  }

  await driver.get(baseUrl);

  for (const cookie of session.cookies) {
    try {
      await driver.manage().addCookie(cookie);
    } catch {
      // Skip cookies the browser rejects (wrong domain, expired, etc.)
    }
  }

  return session;
}

/**
 * Extracts current browser cookies and saves them to the DB.
 */
export async function persistSessionCookies(
  driver: WebDriver,
  userId: string,
  platformId: PlatformId,
): Promise<void> {
  const cookies = await extractCookies(driver);
  await saveSession(userId, platformId, cookies);
}

export { invalidateSession };
