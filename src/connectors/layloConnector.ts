import { Browser, Page } from 'puppeteer';
import { BaseConnector, type ConnectorContext, type ConnectorPublishResult } from './baseConnector';
import { buildBrowser, createPage, extractCookies, getBrowserTimeout, StoredCookie } from './browserSession';
import { acquireOtpCode } from '../services/platformOtpService';
import { log } from '../utils/logger';
import type { PlatformId } from '../utils/platforms';

const BASE_URL = 'https://laylo.az';
const LOGIN_URL = `${BASE_URL}/`;

const ENV_PREFIX = 'LAYLO';

export class LayloConnector extends BaseConnector {
  constructor() {
    super('laylo' as PlatformId, 'Laylo.az');
  }

  /**
   * Publish a listing to Laylo.
   * Currently not fully implemented with Puppeteer - requires full form automation.
   */
  async publishListing(_payload: Record<string, unknown>, _context?: ConnectorContext): Promise<ConnectorPublishResult> {
    throw new Error('Listing publication with Puppeteer is not yet implemented. Use the web interface for now.');
  }
  /**
   * Start platform login: navigate to Laylo, enter phone, request OTP.
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

      console.log('[laylo] Starting login for phone:', phone);

      // Navigate to login page
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: timeoutMs });

      // Click login button if exists
      const loginBtn = await page.$('button:has-text("Daxil ol"), a:has-text("Daxil ol"), [data-cy="login"]');
      if (loginBtn) {
        await loginBtn.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      }

      // Wait for phone input
      const phoneInput = await page.waitForSelector('input[type="tel"], input[type="text"][placeholder*="55"]', { timeout: timeoutMs });
      if (!phoneInput) {
        throw new Error('Phone input not found on Laylo login page');
      }

      // Clear and enter phone
      await phoneInput.evaluate((el: any) => (el.value = ''));
      await phoneInput.type(phone, { delay: 50 });
      console.log('[laylo] Phone entered:', phone);

      // Click send code button
      const sendBtn = await page.$('button[type="submit"], button:has-text("Kod")');
      if (!sendBtn) {
        throw new Error('Send button not found');
      }
      await sendBtn.click();

      // Wait for OTP input
      await page.waitForSelector('input[type="text"], input[placeholder*="kod"]', { timeout: timeoutMs }).catch(() => {});
      console.log('[laylo] OTP request submitted');

      // Store page for later
      (browser as any).__layloPage = page;

      return { success: true };
    } catch (err) {
      console.error('[laylo] startLoginWithPhone failed:', err);
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
    let page = (browser as any).__layloPage;
    if (!page) {
      console.error('[laylo] No stored page for OTP entry');
      return false;
    }

    try {
      const timeoutMs = _timeoutMs ?? getBrowserTimeout();

      console.log('[laylo] Entering OTP');

      // Find OTP input
      const otpInput = await page.waitForSelector('input[type="text"]', { timeout: timeoutMs });
      if (!otpInput) {
        throw new Error('OTP input not found');
      }

      // Type OTP
      await otpInput.evaluate((el: any) => (el.value = ''));
      await otpInput.type(otp, { delay: 100 });

      // Click verify button
      const verifyBtn = await page.$('button[type="submit"], button:has-text("Dov")');
      if (verifyBtn) {
        await verifyBtn.click();
      }

      // Wait for navigation/success
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: timeoutMs }).catch(() => {});

      console.log('[laylo] OTP verified successfully');
      return true;
    } catch (err) {
      console.error('[laylo] completeLoginWithOtp failed:', err);
      return false;
    } finally {
      delete (browser as any).__layloPage;
      if (page) await page.close().catch(() => {});
    }
  }
}
