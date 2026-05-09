import { Browser, Page } from 'puppeteer';
import { BaseConnector, type ConnectorContext, type ConnectorPublishResult } from './baseConnector';
import { buildBrowser, createPage, extractCookies, getBrowserTimeout, StoredCookie } from './browserSession';
import { acquireOtpCode } from '../services/platformOtpService';
import { log } from '../utils/logger';
import type { PlatformId } from '../utils/platforms';

const BASE_URL = 'https://lalafo.az';
const LOGIN_URL = `${BASE_URL}/`;

const ENV_PREFIX = 'LALAFO';

/**
 * Click a button or link by partial text content.
 * Puppeteer doesn't support :has-text() selector, so we use evaluate to find and click directly.
 */
async function clickButtonByText(page: Page, text: string): Promise<void> {
  await page.evaluate((searchText) => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const btn = buttons.find((el) => el.textContent?.trim().includes(searchText));
    if (btn) (btn as HTMLElement).click();
  }, text);
}

export class LalafoConnector extends BaseConnector {
  constructor() {
    super('lalafo' as PlatformId, 'Lalafo');
  }

  /**
   * Publish a listing to Lalafo.
   * Currently not fully implemented with Puppeteer - requires full form automation.
   */
  async publishListing(_payload: Record<string, unknown>, _context?: ConnectorContext): Promise<ConnectorPublishResult> {
    throw new Error('Listing publication with Puppeteer is not yet implemented. Use the web interface for now.');
  }
  /**
   * Start platform login: navigate to Lalafo, enter phone, request OTP.
   */
  async startLoginWithPhone(
    browser: Browser,
    phone: string,
    _timeoutMs?: number,
  ): Promise<{ success: boolean; authFramePath?: any }> {
    let page: Page | null = null;
    try {
      page = await createPage(browser);
      const timeoutMs = _timeoutMs ?? getBrowserTimeout();

      console.log('[lalafo] Starting login for phone:', phone);

      // Navigate to login page
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: timeoutMs });

      // Click login/register button if exists
      const authBtn = await page.$('[data-cy="login"]');
      if (authBtn) {
        await authBtn.click();
      } else {
        await clickButtonByText(page, 'Daxil ol');
      }
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});

      // Wait for phone input
      const phoneInput = await page.waitForSelector('input[type="tel"], input[type="text"][placeholder*="55"]', { timeout: timeoutMs });
      if (!phoneInput) {
        throw new Error('Phone input not found on Lalafo login page');
      }

      // Clear and enter phone
      await phoneInput.evaluate((el: any) => (el.value = ''));
      await phoneInput.type(phone, { delay: 50 });
      console.log('[lalafo] Phone entered:', phone);

      // Click send code button
      const sendBtn = await page.$('button[type="submit"]');
      if (sendBtn) {
        await sendBtn.click();
      } else {
        await clickButtonByText(page, 'Kod');
      }

      // Wait for OTP input to appear
      await page.waitForSelector('input[type="text"], input[placeholder*="kod"]', { timeout: timeoutMs }).catch(() => {});
      console.log('[lalafo] OTP request submitted');

      // Store page for later
      (browser as any).__lalafoPage = page;

      return { success: true };
    } catch (err) {
      console.error('[lalafo] startLoginWithPhone failed:', err);
      if (page) await page.close().catch(() => {});
      return { success: false };
    }
  }

  /**
   * Complete login: enter OTP, submit, extract cookies.
   */
  async completeLoginWithOtp(
    browser: Browser,
    otp: string,
    _timeoutMs?: number,
  ): Promise<boolean> {
    let page = (browser as any).__lalafoPage;
    if (!page) {
      console.error('[lalafo] No stored page for OTP entry');
      return false;
    }

    try {
      const timeoutMs = _timeoutMs ?? getBrowserTimeout();

      console.log('[lalafo] Entering OTP');

      // Find OTP input
      const otpInput = await page.waitForSelector('input[type="text"]', { timeout: timeoutMs });
      if (!otpInput) {
        throw new Error('OTP input not found');
      }

      // Type OTP
      await otpInput.evaluate((el: any) => (el.value = ''));
      await otpInput.type(otp, { delay: 100 });

      // Click verify button
      const verifyBtn = await page.$('button[type="submit"]');
      if (verifyBtn) {
        await verifyBtn.click();
      } else {
        await clickButtonByText(page, 'Dov');
      }

      // Wait for navigation/success
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: timeoutMs }).catch(() => {});

      console.log('[lalafo] OTP verified successfully');
      return true;
    } catch (err) {
      console.error('[lalafo] completeLoginWithOtp failed:', err);
      return false;
    } finally {
      delete (browser as any).__lalafoPage;
      if (page) await page.close().catch(() => {});
    }
  }
}
