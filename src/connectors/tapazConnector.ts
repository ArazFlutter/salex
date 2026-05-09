import { Browser, Page } from 'puppeteer';
import { BaseConnector, type ConnectorContext, type ConnectorPublishResult } from './baseConnector';
import { buildBrowser, createPage, extractCookies, injectSessionCookies, getBrowserTimeout, waitForPageLoad, StoredCookie } from './browserSession';
import { acquireOtpCode } from '../services/platformOtpService';
import { log } from '../utils/logger';
import type { PlatformId } from '../utils/platforms';

const BASE_URL = 'https://tap.az';
const LOGIN_URL = `${BASE_URL}/`;

const ENV_PREFIX = 'TAPAZ';

/**
 * Find a button or link by partial text content.
 * Puppeteer doesn't support :has-text() selector, so we use evaluate.
 */
async function findButtonByText(page: Page, text: string): Promise<any> {
  return page.evaluateHandle((searchText) => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    return buttons.find((el) => el.textContent?.trim().includes(searchText));
  }, text);
}

export class TapazConnector extends BaseConnector {
  constructor() {
    super('tapaz' as PlatformId, 'Tap.az');
  }

  /**
   * Publish a listing to Tap.az.
   * Currently not fully implemented with Puppeteer - requires full form automation.
   */
  async publishListing(_payload: Record<string, unknown>, _context?: ConnectorContext): Promise<ConnectorPublishResult> {
    throw new Error('Listing publication with Puppeteer is not yet implemented. Use the web interface for now.');
  }
  /**
   * Start platform login: navigate to Tap.az, find login form, enter phone, request OTP.
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

      console.log('[tapaz] Starting login for phone:', phone);

      // Navigate to login page
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: timeoutMs });

      // Find and click login button if needed
      let loginButton = await page.$('[data-cy="login-button"]');
      if (!loginButton) {
        loginButton = await findButtonByText(page, 'Daxil ol');
      }
      if (loginButton) {
        await loginButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});
      }

      // Wait for phone input and enter phone
      const phoneInput = await page.waitForSelector('input[type="tel"], input[placeholder*="55"], input[name*="phone"]', { timeout: timeoutMs });
      if (!phoneInput) {
        throw new Error('Phone input not found on Tap.az login page');
      }

      // Clear and type phone
      await phoneInput.evaluate((el: any) => (el.value = ''));
      await phoneInput.type(phone, { delay: 50 });
      console.log('[tapaz] Phone entered:', phone);

      // Find and click submit button
      let submitBtn = await page.$('button[type="submit"]');
      if (!submitBtn) {
        submitBtn = await findButtonByText(page, 'Davam');
      }
      if (!submitBtn) {
        submitBtn = await findButtonByText(page, 'Kodu');
      }
      if (!submitBtn) {
        throw new Error('Submit button not found');
      }
      await submitBtn.click();

      // Wait for OTP request to be sent (page may show OTP input or success message)
      await page.waitForSelector('input[type="text"], input[placeholder*="kod"], input[placeholder*="OTP"]', { timeout: timeoutMs }).catch(() => {});
      console.log('[tapaz] OTP request submitted');

      // Store page for later use
      (browser as any).__tapazPage = page;

      return { success: true };
    } catch (err) {
      console.error('[tapaz] startLoginWithPhone failed:', err);
      if (page) await page.close().catch(() => {});
      return { success: false };
    }
  }

  /**
   * Complete login: enter OTP, submit, extract and save cookies.
   */
  async completeLoginWithOtp(
    browser: Browser,
    otp: string,
    _authFramePath?: any,
    _timeoutMs?: number,
  ): Promise<boolean> {
    let page = (browser as any).__tapazPage;
    if (!page) {
      console.error('[tapaz] No stored page for OTP entry');
      return false;
    }

    try {
      const timeoutMs = _timeoutMs ?? getBrowserTimeout();

      console.log('[tapaz] Entering OTP');

      // Find OTP input
      const otpInput = await page.waitForSelector('input[type="text"]:not([aria-label*="email"])', { timeout: timeoutMs });
      if (!otpInput) {
        throw new Error('OTP input not found');
      }

      // Type OTP
      await otpInput.evaluate((el: any) => (el.value = ''));
      await otpInput.type(otp, { delay: 100 });

      // Find and click verify button
      let verifyBtn = await page.$('button[type="submit"]');
      if (!verifyBtn) {
        verifyBtn = await findButtonByText(page, 'Dov');
      }
      if (!verifyBtn) {
        verifyBtn = await findButtonByText(page, 'Tamamla');
      }
      if (verifyBtn) {
        await verifyBtn.click();
      }

      // Wait for login success - check if we're logged in
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: timeoutMs }).catch(() => {});

      // Check if login was successful by looking for dashboard elements
      const isLoggedIn = await page.$('[data-cy="dashboard"], .dashboard, [class*="profile"]');
      if (!isLoggedIn) {
        // Try to detect error message
        const errorMsg = await page.$('[class*="error"], [class*="alert"], [role="alert"]');
        if (errorMsg) {
          throw new Error('Login verification failed - error message displayed');
        }
      }

      console.log('[tapaz] OTP verified successfully');
      return true;
    } catch (err) {
      console.error('[tapaz] completeLoginWithOtp failed:', err);
      return false;
    } finally {
      delete (browser as any).__tapazPage;
      if (page) await page.close().catch(() => {});
    }
  }
}
