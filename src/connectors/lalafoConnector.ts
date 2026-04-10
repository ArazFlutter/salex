import * as fs from 'fs';
import * as path from 'path';
import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver';
import { BaseConnector, type ConnectorContext, type ConnectorPublishResult } from './baseConnector';
import {
  buildChromeDriver,
  getSeleniumTimeout,
  waitForPageLoad,
  injectSessionCookies,
  persistSessionCookies,
  invalidateSession,
} from './seleniumSession';
import type { LalafoPayload } from '../mappers/platforms/lalafoMapper';
import { selectCategoryPathWithVariants } from './categoryPathNav';
import { categoryPathVariantsForLalafo } from './platformCategoryLabels';
import { downloadImages, cleanupDownloadedImages, type DownloadResult } from '../utils/downloadImages';

const ENV_PREFIX = 'LALAFO';
const BASE_URL = 'https://lalafo.az';

const NEW_LISTING_CANDIDATES = [
  `${BASE_URL}/azerbaijan/post`,
  `${BASE_URL}/azerbaijan/create`,
  `${BASE_URL}/azerbaijan/add`,
  `${BASE_URL}/post`,
  `${BASE_URL}/create`,
  `${BASE_URL}/add`,
  `${BASE_URL}/post-ad`,
  `${BASE_URL}/new`,
];

const OTP_POLL_INTERVAL_MS = 2000;
const DEFAULT_OTP_TIMEOUT_MS = 120_000;

/** Prefer explicit listing slug; avoid matching arbitrary "id-12" segments. */
const LALAFO_LISTING_ID_RE = /\/listing-id-(\d{5,})(?:\/|[?#]|$)/i;
const LALAFO_LEGACY_ID_RE = /(?:^|[/._-])id-(\d{6,})(?:\/|[?#]|$)/i;

type PostSubmitSignals = {
  urlBefore: string;
  urlAfter: string;
  urlChanged: boolean;
  listingIdFromUrl: string | null;
  canonicalUrl: string | null;
  ogUrl: string | null;
  listingIdFromMeta: string | null;
  pageTitle: string;
  successIndicators: string[];
  errorIndicators: string[];
  formStillVisible: boolean;
  confirmationText: string | null;
};

export class LalafoConnector extends BaseConnector {
  constructor() {
    super('lalafo', 'Lalafo');
  }

  // -------------------------------------------------------------------------
  //  publishListing — real Selenium-based form submission
  // -------------------------------------------------------------------------
  async publishListing(payload: Record<string, unknown>, context?: ConnectorContext): Promise<ConnectorPublishResult> {
    const lalafo = payload as unknown as LalafoPayload;
    const driver = await buildChromeDriver(ENV_PREFIX);
    const timeoutMs = getSeleniumTimeout(ENV_PREFIX);
    const userId = context?.userId;
    let imageDownload: DownloadResult | null = null;

    try {
      if (lalafo.photos.length > 0) {
        console.log(`[lalafo] downloading ${lalafo.photos.length} image(s)…`);
        imageDownload = await downloadImages(lalafo.photos);
        if (imageDownload.skipped.length > 0) {
          console.log(`[lalafo] ${imageDownload.skipped.length} image(s) skipped`);
        }
      }

      await this.ensureAuthenticated(driver, timeoutMs, userId);

      const listingPageReached = await this.navigateToNewListingPage(driver, timeoutMs);
      if (!listingPageReached) {
        throw new Error('Could not navigate to new listing page');
      }

      await this.selectCategoryPath(driver, lalafo.categoryPath, timeoutMs);
      await this.fillListingForm(driver, lalafo, imageDownload, timeoutMs);
      const result = await this.submitAndExtractResult(driver, timeoutMs);

      result.publishMetadata = {
        ...result.publishMetadata,
        listingTitle: lalafo.name,
        listingPrice: lalafo.amount,
        listingCity: lalafo.location,
      };

      if (userId) {
        await persistSessionCookies(driver, userId, this.platformId);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Lalafo publish failed: ${message}`);
    } finally {
      if (imageDownload) {
        cleanupDownloadedImages(imageDownload.tempDir);
      }
      await driver.quit().catch(() => undefined);
    }
  }

  // -------------------------------------------------------------------------
  //  getListingUrl
  // -------------------------------------------------------------------------
  override getListingUrl(result: ConnectorPublishResult): string | null {
    if (result.externalUrl) return result.externalUrl;
    if (!result.externalListingId) return null;
    return `${BASE_URL}/azerbaijan/ads/listing-id-${result.externalListingId}`;
  }

  // -------------------------------------------------------------------------
  //  fetchListingUrl — two-strategy Selenium recovery
  // -------------------------------------------------------------------------
  override async fetchListingUrl(result: ConnectorPublishResult, context?: ConnectorContext): Promise<string | null> {
    const meta = result.publishMetadata;
    const listingTitle = meta?.listingTitle ? String(meta.listingTitle) : null;
    const listingPrice = meta?.listingPrice != null ? Number(meta.listingPrice) : null;

    const id = result.externalListingId;
    const directCandidates: string[] = [];
    if (result.externalUrl) directCandidates.push(result.externalUrl);
    const primary = this.getListingUrl(result);
    if (primary) directCandidates.push(primary);
    if (id) {
      directCandidates.push(`${BASE_URL}/azerbaijan/ads/listing-id-${id}`);
      directCandidates.push(`${BASE_URL}/azerbaijan/listing-id-${id}`);
    }
    const uniqueCandidates = [...new Set(directCandidates.filter(Boolean))];

    if (uniqueCandidates.length === 0 && !listingTitle) return null;

    const driver = await buildChromeDriver(ENV_PREFIX);
    const timeoutMs = getSeleniumTimeout(ENV_PREFIX);
    const userId = context?.userId;

    try {
      await this.ensureAuthenticated(driver, timeoutMs, userId);

      for (const candidateUrl of uniqueCandidates) {
        await driver.get(candidateUrl);
        await waitForPageLoad(driver, timeoutMs);
        const url = await this.extractPageUrl(driver, candidateUrl);
        if (url) {
          console.log('[lalafo] recovery: resolved via direct URL');
          if (userId) await persistSessionCookies(driver, userId, this.platformId);
          return url;
        }
      }

      if (listingTitle && userId) {
        const url = await this.searchUserListingsForMatch(driver, listingTitle, listingPrice, timeoutMs);
        if (url) {
          console.log('[lalafo] recovery: resolved via user listings search');
          await persistSessionCookies(driver, userId, this.platformId);
          return url;
        }
      }

      if (userId) await persistSessionCookies(driver, userId, this.platformId);
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Lalafo Selenium recovery failed: ${message}`);
    } finally {
      await driver.quit().catch(() => undefined);
    }
  }

  // -------------------------------------------------------------------------
  //  normalizeError
  // -------------------------------------------------------------------------
  override normalizeError(error: unknown) {
    if (error instanceof Error) {
      if (error.message.startsWith('Lalafo publish failed:')) {
        return { code: 'LALAFO_PUBLISH_ERROR', message: error.message };
      }

      if (error.message.includes('login failed') || error.message.includes('Session expired and login failed')) {
        return { code: 'LALAFO_LOGIN_ERROR', message: error.message };
      }

      if (error.message.startsWith('Lalafo Selenium recovery failed:')) {
        return { code: 'LALAFO_SELENIUM_RECOVERY_ERROR', message: error.message };
      }
    }

    return super.normalizeError(error);
  }

  // =========================================================================
  //  Private — authentication
  // =========================================================================

  private loginEnvHint(): string {
    return (
      'Set LALAFO_LOGIN_PHONE and LALAFO_OTP_CODE or LALAFO_OTP_FILE. ' +
      'Alternatively persist session cookies for this user after a successful login.'
    );
  }

  private async ensureAuthenticated(driver: WebDriver, timeoutMs: number, userId?: string): Promise<void> {
    if (!userId) {
      console.warn('[lalafo] no userId in context — session injection skipped; post form may require login');
      return;
    }

    const phoneConfigured = Boolean(process.env.LALAFO_LOGIN_PHONE?.trim());
    const session = await injectSessionCookies(driver, BASE_URL, userId, this.platformId);

    if (!session) {
      if (!phoneConfigured) {
        throw new Error(`Lalafo: no stored session for user and LALAFO_LOGIN_PHONE is not set. ${this.loginEnvHint()}`);
      }
      const loggedIn = await this.performLogin(driver, timeoutMs);
      if (loggedIn) {
        await persistSessionCookies(driver, userId, this.platformId);
        return;
      }
      throw new Error(`Lalafo: login failed (check LALAFO_LOGIN_PHONE / OTP). ${this.loginEnvHint()}`);
    }

    await driver.get(BASE_URL);
    await waitForPageLoad(driver, timeoutMs);

    const valid = await this.isSessionValid(driver);

    if (!valid) {
      if (!phoneConfigured) {
        await invalidateSession(userId, this.platformId);
        throw new Error(
          `Lalafo: session cookies invalid/expired and LALAFO_LOGIN_PHONE is not set. ${this.loginEnvHint()}`,
        );
      }
      const loggedIn = await this.performLogin(driver, timeoutMs);
      if (loggedIn) {
        await persistSessionCookies(driver, userId, this.platformId);
        return;
      }
      await invalidateSession(userId, this.platformId);
      throw new Error(`Lalafo: session expired and interactive login failed. ${this.loginEnvHint()}`);
    }
  }

  private async isSessionValid(driver: WebDriver): Promise<boolean> {
    try {
      return await driver.executeScript<boolean>(`
        return !!(
          document.querySelector('.user-avatar, .user-menu, [data-testid="user-menu"], .profile-link') ||
          document.querySelector('a[href*="/profile"], a[href*="/cabinet"], a[href*="/my"]') ||
          document.querySelector('[class*="logged-in"], [class*="user-info"], [class*="UserMenu"]')
        );
      `);
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  //  performLogin — real phone + OTP flow
  // -------------------------------------------------------------------------

  private async performLogin(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    const phone = process.env.LALAFO_LOGIN_PHONE?.trim();

    if (!phone) {
      console.log('[lalafo] LALAFO_LOGIN_PHONE not configured — performLogin aborted (caller should validate env)');
      return false;
    }

    try {
      await driver.get(BASE_URL);
      await waitForPageLoad(driver, timeoutMs);

      const loginOpened = await this.openLoginForm(driver, timeoutMs);
      if (!loginOpened) {
        console.log('[lalafo] login form could not be opened');
        return false;
      }

      const phoneEntered = await this.enterPhoneNumber(driver, phone, timeoutMs);
      if (!phoneEntered) {
        console.log('[lalafo] could not enter phone number');
        return false;
      }

      const otpRequested = await this.submitPhoneForOtp(driver, timeoutMs);
      if (!otpRequested) {
        console.log('[lalafo] could not submit phone number for OTP');
        return false;
      }

      const otp = await this.acquireOtpCode(phone);
      if (!otp) {
        console.log('[lalafo] OTP acquisition timed out or failed');
        return false;
      }

      const otpEntered = await this.enterOtpCode(driver, otp);
      if (!otpEntered) {
        console.log('[lalafo] could not enter OTP code');
        return false;
      }

      await this.submitOtpVerification(driver, timeoutMs);

      const success = await this.waitForLoginSuccess(driver, timeoutMs);
      if (!success) {
        console.log('[lalafo] login did not complete — session not valid after OTP');
        return false;
      }

      console.log('[lalafo] login successful');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`[lalafo] login failed: ${msg}`);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  //  Login sub-steps
  // -------------------------------------------------------------------------

  private async openLoginForm(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    const clicked = await driver.executeScript<boolean>(`
      var links = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      var keywords = ['daxil ol', 'giriş', 'войти', 'login', 'sign in'];
      for (var i = 0; i < links.length; i++) {
        var text = (links[i].textContent || '').trim().toLowerCase();
        if (keywords.some(function(k) { return text.includes(k); })) {
          links[i].click();
          return true;
        }
      }
      var byHref = document.querySelector('a[href*="login"], a[href*="signin"], a[href*="auth"]');
      if (byHref) { byHref.click(); return true; }
      return false;
    `);

    if (!clicked) return false;

    try {
      await driver.wait(async () => {
        return await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('input[type="tel"], input[name="phone"], input[name="login"]') ||
            document.querySelector('.modal, [class*="auth-modal"], [class*="login"]')
          );
        `);
      }, timeoutMs);
    } catch {
      // form may already be visible
    }

    return true;
  }

  private async enterPhoneNumber(driver: WebDriver, phone: string, timeoutMs: number): Promise<boolean> {
    const phoneInput = await this.findFirstVisible(driver, [
      'input[type="tel"]',
      'input[name="phone"]',
      'input[name="login"]',
      'input[name="mobile"]',
      'input[placeholder*="nömrə" i]',
      'input[placeholder*="telefon" i]',
      'input[placeholder*="phone" i]',
      '.modal input[type="tel"]',
      '.modal input[type="text"]',
    ]);

    if (!phoneInput) {
      try {
        await driver.wait(
          until.elementLocated(By.css('input[type="tel"], input[name="phone"]')),
          Math.min(timeoutMs, 5000),
        );
        const el = await driver.findElement(By.css('input[type="tel"], input[name="phone"]'));
        if (await el.isDisplayed()) {
          await el.clear();
          await el.sendKeys(phone);
          return true;
        }
      } catch { /* fall through */ }
      return false;
    }

    await phoneInput.clear();
    await phoneInput.sendKeys(phone);
    return true;
  }

  private async submitPhoneForOtp(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    const submitted = await driver.executeScript<boolean>(`
      var buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn'));
      var keywords = ['göndər', 'davam', 'daxil', 'giriş', 'next', 'send', 'отправить', 'continue'];
      for (var i = 0; i < buttons.length; i++) {
        var text = (buttons[i].textContent || buttons[i].value || '').trim().toLowerCase();
        if (keywords.some(function(k) { return text.includes(k); })) {
          buttons[i].click();
          return true;
        }
      }
      var formBtn = document.querySelector('form button[type="submit"], form input[type="submit"]');
      if (formBtn) { formBtn.click(); return true; }
      return false;
    `);

    if (!submitted) return false;

    try {
      await driver.wait(async () => {
        return await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('input[name="code"], input[name="otp"], input[name="sms_code"]') ||
            document.querySelector('input[maxlength="4"], input[maxlength="5"], input[maxlength="6"]') ||
            document.querySelectorAll('input[maxlength="1"]').length >= 4
          );
        `);
      }, timeoutMs);
    } catch {
      console.log('[lalafo] OTP input field not detected — continuing');
    }

    return true;
  }

  private async enterOtpCode(driver: WebDriver, otp: string): Promise<boolean> {
    const splitInputs = await driver.findElements(By.css('input[maxlength="1"]'));
    const visible: WebElement[] = [];
    for (const el of splitInputs) {
      try { if (await el.isDisplayed()) visible.push(el); } catch { /* skip */ }
    }

    if (visible.length >= 4 && visible.length <= 8) {
      for (let i = 0; i < Math.min(otp.length, visible.length); i++) {
        await visible[i].clear();
        await visible[i].sendKeys(otp[i]);
      }
      return true;
    }

    const otpInput = await this.findFirstVisible(driver, [
      'input[name="code"]',
      'input[name="otp"]',
      'input[name="sms_code"]',
      'input[maxlength="4"]',
      'input[maxlength="5"]',
      'input[maxlength="6"]',
      'input[placeholder*="kod" i]',
      'input[placeholder*="code" i]',
      'input[placeholder*="SMS" i]',
    ]);

    if (!otpInput) return false;
    await otpInput.clear();
    await otpInput.sendKeys(otp);
    return true;
  }

  private async submitOtpVerification(driver: WebDriver, timeoutMs: number): Promise<void> {
    await driver.executeScript(`
      var buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      var keywords = ['təsdiq', 'daxil', 'giriş', 'verify', 'confirm', 'ok', 'göndər'];
      for (var i = 0; i < buttons.length; i++) {
        var text = (buttons[i].textContent || buttons[i].value || '').trim().toLowerCase();
        if (keywords.some(function(k) { return text.includes(k); })) {
          buttons[i].click();
          return;
        }
      }
      var formBtn = document.querySelector('form button[type="submit"]');
      if (formBtn) formBtn.click();
    `);

    try { await driver.sleep(Math.min(timeoutMs, 3000)); } catch { /* ignore */ }
  }

  private async waitForLoginSuccess(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    try {
      await driver.wait(async () => {
        const ready = await driver.executeScript<string>('return document.readyState');
        if (ready !== 'complete') return false;
        return await this.isSessionValid(driver);
      }, timeoutMs);
      return true;
    } catch {
      try {
        await driver.get(BASE_URL);
        await waitForPageLoad(driver, timeoutMs);
        return await this.isSessionValid(driver);
      } catch {
        return false;
      }
    }
  }

  // -------------------------------------------------------------------------
  //  OTP acquisition — env var or file-based exchange
  // -------------------------------------------------------------------------

  private async acquireOtpCode(phone: string): Promise<string | null> {
    const staticOtp = process.env.LALAFO_OTP_CODE?.trim();
    if (staticOtp && /^\d{4,6}$/.test(staticOtp)) {
      console.log('[lalafo] using OTP from LALAFO_OTP_CODE env var');
      return staticOtp;
    }
    return this.pollOtpFromFile(phone);
  }

  private async pollOtpFromFile(phone: string): Promise<string | null> {
    const otpFilePath = process.env.LALAFO_OTP_FILE?.trim()
      || path.join(process.cwd(), '.lalafo-otp');
    const otpTimeoutMs = Number(process.env.LALAFO_OTP_TIMEOUT_MS) || DEFAULT_OTP_TIMEOUT_MS;

    try {
      fs.writeFileSync(otpFilePath, 'WAITING', 'utf-8');
    } catch (err) {
      console.log(`[lalafo] could not write OTP file at ${otpFilePath}: ${err}`);
      return null;
    }

    console.log('─'.repeat(60));
    console.log(`[lalafo] OTP required for phone: ${phone}`);
    console.log(`[lalafo] Write the OTP code to: ${otpFilePath}`);
    console.log(`[lalafo] Timeout: ${Math.round(otpTimeoutMs / 1000)}s`);
    console.log(`[lalafo] Example: echo 1234 > "${otpFilePath}"`);
    console.log('─'.repeat(60));

    const deadline = Date.now() + otpTimeoutMs;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, OTP_POLL_INTERVAL_MS));

      try {
        const content = fs.readFileSync(otpFilePath, 'utf-8').trim();
        const match = content.match(/^(\d{4,6})$/);
        if (match) {
          console.log('[lalafo] OTP code received from file');
          try { fs.unlinkSync(otpFilePath); } catch { /* ignore */ }
          return match[1];
        }
      } catch { /* file may be missing */ }
    }

    console.log('[lalafo] OTP timeout — no code received');
    try { fs.unlinkSync(otpFilePath); } catch { /* ignore */ }
    return null;
  }

  // =========================================================================
  //  Private — navigate to new listing page (multi-URL + button fallback)
  // =========================================================================

  private async navigateToNewListingPage(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    for (const url of NEW_LISTING_CANDIDATES) {
      try {
        await driver.get(url);
        await waitForPageLoad(driver, timeoutMs);
        const hasForm = await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('input[name="title"], input[name="name"], input[id*="title" i]') ||
            document.querySelector('textarea[name="description"], textarea[name="details"], textarea[id*="description" i]') ||
            document.querySelector('input[placeholder*="Başlıq" i], input[placeholder*="название" i]') ||
            document.querySelector('input[type="file"]')
          );
        `);
        if (hasForm) {
          console.log(`[lalafo] new listing page found at: ${url}`);
          return true;
        }
      } catch { continue; }
    }

    await driver.get(BASE_URL);
    await waitForPageLoad(driver, timeoutMs);
    const clicked = await driver.executeScript<boolean>(`
      var links = Array.from(document.querySelectorAll('a, button'));
      var keywords = ['elan yerləşdir', 'elan ver', 'yeni elan', 'add', 'post', 'create'];
      for (var i = 0; i < links.length; i++) {
        var text = (links[i].textContent || '').trim().toLowerCase();
        if (keywords.some(function(k) { return text.includes(k); })) {
          links[i].click();
          return true;
        }
      }
      return false;
    `);

    if (clicked) {
      await waitForPageLoad(driver, timeoutMs);
      return true;
    }

    console.log('[lalafo] could not find new listing page');
    return false;
  }

  // =========================================================================
  //  Private — category selection
  // =========================================================================

  private async selectCategoryPath(driver: WebDriver, path: string[], timeoutMs: number): Promise<void> {
    if (path.length === 0) {
      throw new Error('Lalafo categoryPath is empty — mapping must supply full navigation path');
    }
    const variants = categoryPathVariantsForLalafo(path);
    await selectCategoryPathWithVariants(driver, variants, timeoutMs, 'lalafo');
  }

  // =========================================================================
  //  Private — form filling
  // =========================================================================

  private async fillListingForm(
    driver: WebDriver,
    payload: LalafoPayload,
    imageDownload: DownloadResult | null,
    timeoutMs: number,
  ): Promise<void> {
    await this.waitForFormReady(driver, timeoutMs);

    await this.fillFieldRequired(
      driver,
      'title',
      payload.name,
      [
        'input[name="title"]',
        'input[name="name"]',
        'input[name="ad_title"]',
        'input[id*="title" i]',
        'input[placeholder*="başlıq" i]',
        'input[placeholder*="ad" i]',
        'input[placeholder*="название" i]',
        'input[aria-label*="başlıq" i]',
        'input[data-testid="title"]',
        'input[data-testid*="title" i]',
      ],
    );

    await this.fillTextFieldRequired(
      driver,
      'description',
      payload.details,
      [
        'textarea[name="description"]',
        'textarea[name="details"]',
        'textarea[name="body"]',
        'textarea[id*="description" i]',
        'textarea[placeholder*="təsvir" i]',
        'textarea[placeholder*="описание" i]',
        'textarea[aria-label*="təsvir" i]',
        '[contenteditable="true"]',
        'textarea[data-testid="description"]',
        'textarea[data-testid*="description" i]',
      ],
    );

    await this.fillFieldRequired(
      driver,
      'price',
      String(payload.amount),
      [
        'input[name="price"]',
        'input[name="amount"]',
        'input[id*="price" i]',
        'input[type="number"]',
        'input[inputmode="numeric"]',
        'input[placeholder*="qiymət" i]',
        'input[placeholder*="цена" i]',
        'input[aria-label*="qiymət" i]',
        'input[data-testid="price"]',
        'input[data-testid*="price" i]',
      ],
    );

    await this.selectLocation(driver, payload.location);

    if (imageDownload && imageDownload.images.length > 0) {
      await this.uploadImages(driver, imageDownload);
    }
  }

  private async waitForFormReady(driver: WebDriver, timeoutMs: number): Promise<void> {
    try {
      await driver.wait(async () => {
        return await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('input[name="title"], input[name="name"], input[id*="title" i]') ||
            document.querySelector('textarea[name="description"], textarea[name="details"], textarea[id*="description" i]') ||
            document.querySelector('input[name="price"], input[name="amount"], input[id*="price" i]') ||
            document.querySelector('input[placeholder*="Başlıq" i]')
          );
        `);
      }, timeoutMs);
    } catch {
      console.log('[lalafo] form detection timed out — attempting to fill anyway');
    }
  }

  private async fillFieldRequired(
    driver: WebDriver,
    logicalName: string,
    value: string,
    selectors: string[],
  ): Promise<void> {
    const element = await this.findFirstVisible(driver, selectors);
    if (!element) {
      throw new Error(
        `Lalafo FORM_FIELD_NOT_FOUND: "${logicalName}" — no visible input matched (${selectors.slice(0, 4).join(', ')}…)`,
      );
    }
    await element.clear();
    await element.sendKeys(value);
  }

  private async fillTextFieldRequired(
    driver: WebDriver,
    logicalName: string,
    value: string,
    selectors: string[],
  ): Promise<void> {
    const element = await this.findFirstVisible(driver, selectors);
    if (!element) {
      throw new Error(
        `Lalafo FORM_FIELD_NOT_FOUND: "${logicalName}" — no visible field matched (${selectors.slice(0, 4).join(', ')}…)`,
      );
    }
    const tag = await element.getTagName();
    if (tag === 'div' || tag === 'span') {
      await driver.executeScript(
        'arguments[0].innerText = arguments[1]; arguments[0].dispatchEvent(new Event("input", {bubbles:true}));',
        element, value,
      );
    } else {
      await element.clear();
      await element.sendKeys(value);
    }
  }

  private async fillField(driver: WebDriver, value: string, selectors: string[]): Promise<void> {
    const element = await this.findFirstVisible(driver, selectors);
    if (!element) {
      console.log(`[lalafo] could not find field — tried: ${selectors[0]}…`);
      return;
    }
    await element.clear();
    await element.sendKeys(value);
  }

  private async fillTextField(driver: WebDriver, value: string, selectors: string[]): Promise<void> {
    const element = await this.findFirstVisible(driver, selectors);
    if (!element) {
      console.log(`[lalafo] could not find text field — tried: ${selectors[0]}…`);
      return;
    }
    const tag = await element.getTagName();
    if (tag === 'div' || tag === 'span') {
      await driver.executeScript(
        'arguments[0].innerText = arguments[1]; arguments[0].dispatchEvent(new Event("input", {bubbles:true}));',
        element, value,
      );
    } else {
      await element.clear();
      await element.sendKeys(value);
    }
  }

  private async selectLocation(driver: WebDriver, location: string): Promise<void> {
    const selected = await driver.executeScript<boolean>(`
      var selects = document.querySelectorAll('select[name="city"], select[name="region"], select[name="location"]');
      for (var i = 0; i < selects.length; i++) {
        for (var j = 0; j < selects[i].options.length; j++) {
          if (selects[i].options[j].text.trim().toLowerCase().includes(arguments[0].toLowerCase())) {
            selects[i].value = selects[i].options[j].value;
            selects[i].dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }
      var buttons = document.querySelectorAll('[class*="city"] button, [class*="location"] button, [class*="region"] a');
      for (var k = 0; k < buttons.length; k++) {
        if ((buttons[k].textContent || '').trim().toLowerCase().includes(arguments[0].toLowerCase())) {
          buttons[k].click();
          return true;
        }
      }
      return false;
    `, location);

    if (!selected) {
      console.log(`[lalafo] location "${location}" not matched — form may use default`);
    }
  }

  private async uploadImages(driver: WebDriver, download: DownloadResult): Promise<void> {
    const localPaths = download.images.map((img) => img.localPath);
    if (localPaths.length === 0) {
      console.log('[lalafo] no local images to upload');
      return;
    }

    try {
      const fileInputs = await driver.findElements(By.css(
        'input[type="file"], input[accept*="image"], [class*="upload"] input[type="file"]',
      ));

      if (fileInputs.length === 0) {
        console.log('[lalafo] no file input found on page — skipping image upload');
        return;
      }

      const fileInput = fileInputs[0];
      await driver.executeScript(
        'arguments[0].style.display = "block"; arguments[0].style.visibility = "visible"; arguments[0].style.opacity = "1"; arguments[0].style.height = "auto"; arguments[0].style.width = "auto"; arguments[0].style.position = "static";',
        fileInput,
      );

      const acceptsMultiple = await fileInput.getAttribute('multiple');

      if (acceptsMultiple !== null) {
        await fileInput.sendKeys(localPaths.join('\n'));
        console.log(`[lalafo] uploaded ${localPaths.length} image(s) via multi-file input`);
      } else {
        await fileInput.sendKeys(localPaths[0]);
        console.log('[lalafo] uploaded 1 image via single-file input');

        for (let i = 1; i < localPaths.length; i++) {
          try {
            await driver.sleep(1000);
            const freshInputs = await driver.findElements(By.css('input[type="file"]'));
            let uploaded = false;
            for (const input of freshInputs) {
              try {
                const val = await input.getAttribute('value');
                if (!val) {
                  await driver.executeScript(
                    'arguments[0].style.display = "block"; arguments[0].style.visibility = "visible"; arguments[0].style.opacity = "1";',
                    input,
                  );
                  await input.sendKeys(localPaths[i]);
                  uploaded = true;
                  console.log(`[lalafo] uploaded image ${i + 1}/${localPaths.length}`);
                  break;
                }
              } catch { continue; }
            }
            if (!uploaded) {
              console.log(`[lalafo] no available file input for image ${i + 1} — stopping`);
              break;
            }
          } catch {
            console.log(`[lalafo] failed to upload image ${i + 1} — stopping`);
            break;
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`[lalafo] image upload error: ${msg} — continuing without images`);
    }
  }

  // =========================================================================
  //  Private — form submission & result extraction (3-phase)
  // =========================================================================

  private async submitAndExtractResult(driver: WebDriver, timeoutMs: number): Promise<ConnectorPublishResult> {
    const urlBefore = await driver.getCurrentUrl();

    const submitted = await this.trySubmit(driver);
    if (!submitted) {
      throw new Error(
        'Lalafo FORM_SUBMIT_NOT_FOUND: no submit control matched (button[type=submit], primary CTA, or keywords yerləşdir/publish)',
      );
    }

    await this.waitForSubmitResponse(driver, urlBefore, timeoutMs);
    const signals = await this.collectPostSubmitSignals(driver, urlBefore);
    return this.classifyPublishOutcome(signals);
  }

  private async waitForSubmitResponse(driver: WebDriver, urlBefore: string, timeoutMs: number): Promise<void> {
    await driver.sleep(1500);
    const remaining = Math.max(timeoutMs - 1500, 3000);

    try {
      await driver.wait(async () => {
        return await driver.executeScript<boolean>(`
          if (window.location.href !== arguments[0]) return true;
          if (document.querySelector('.success-message, .alert-success, [class*="congratul"], [class*="success"]'))
            return true;
          if (document.querySelector('.error-message, .alert-danger, .alert-error, .field-error'))
            return true;
          var formFields = document.querySelectorAll(
            'input[name="title"], input[name="name"], input[id*="title" i], textarea[name="description"], textarea[name="details"]'
          );
          if (formFields.length === 0) return true;
          return false;
        `, urlBefore);
      }, remaining);
    } catch { /* timeout is not fatal */ }

    await waitForPageLoad(driver, Math.min(timeoutMs, 5000)).catch(() => undefined);
  }

  private async collectPostSubmitSignals(driver: WebDriver, urlBefore: string): Promise<PostSubmitSignals> {
    const urlAfter = await driver.getCurrentUrl();
    const urlChanged = urlAfter !== urlBefore;

    const adsSlugId = urlAfter.match(/\/ads\/[^/?#]+-id-(\d{5,})(?:\/|[?#]|$)/i);
    const urlIdMatch =
      urlAfter.match(LALAFO_LISTING_ID_RE) ?? urlAfter.match(LALAFO_LEGACY_ID_RE) ?? adsSlugId;
    const listingIdFromUrl = urlIdMatch ? urlIdMatch[1] : null;

    const dom = await driver.executeScript<{
      canonicalUrl: string | null;
      ogUrl: string | null;
      listingIdFromMeta: string | null;
      pageTitle: string;
      successIndicators: string[];
      errorIndicators: string[];
      formStillVisible: boolean;
      confirmationText: string | null;
    }>(`
      var canonical = document.querySelector('link[rel="canonical"]');
      var ogUrl = document.querySelector('meta[property="og:url"]');
      var metaUrl = (canonical && canonical.href) || (ogUrl && ogUrl.content) || '';
      var metaIdMatch = metaUrl.match(/\\/listing-id-(\\d{5,})(?:\\/|[\\/?#]|$)/i)
        || metaUrl.match(/\\/ads\\/[^/?#]+-id-(\\d{5,})(?:\\/|[\\/?#]|$)/i)
        || metaUrl.match(/(?:^|[/._-])id-(\\d{6,})(?:\\/|[\\/?#]|$)/i);

      var body = (document.body && document.body.innerText) || '';
      var bodyLower = body.substring(0, 2000);

      var successIndicators = [];
      if (/elan[ıi]n[ıi]z.*yerləşdiril/i.test(bodyLower)) successIndicators.push('az_listing_published');
      if (/elan.*uğurla/i.test(bodyLower)) successIndicators.push('az_success_ugurla');
      if (/elan.*əlavə.*edildi/i.test(bodyLower)) successIndicators.push('az_listing_added');
      if (/uğurla.*yerlə/i.test(bodyLower)) successIndicators.push('az_ugurla_yerlesdi');
      if (/объявление.*опубликовано/i.test(bodyLower)) successIndicators.push('ru_published');
      if (/successfully.*publish/i.test(bodyLower)) successIndicators.push('en_published');
      if (document.querySelector('.success-message, .alert-success, [class*="Success"], [class*="success"]')) successIndicators.push('success_element');
      if (document.querySelector('[class*="congratul"], [class*="Celebration"]')) successIndicators.push('congratulation_element');
      if (window.location.href.match(/\\/listing-id-\\d+|\\/ads\\/[^/]+-id-\\d+/i)) successIndicators.push('url_listing_pattern');

      var errorIndicators = [];
      if (document.querySelector('.error-message, .alert-danger, .alert-error')) errorIndicators.push('error_element');
      if (document.querySelector('.field-error, .form-error, .validation-error')) errorIndicators.push('validation_error');
      if (/xəta|səhv|uğursuz/i.test(bodyLower)) errorIndicators.push('az_error_text');
      if (/doldurun|tələb.*olunur/i.test(bodyLower)) errorIndicators.push('az_validation_text');
      if (/(?:^|\\W)error(?:\\W|$)|failed|required/i.test(bodyLower)) errorIndicators.push('en_error_text');
      if (/ошибка|не удалось/i.test(bodyLower)) errorIndicators.push('ru_error_text');

      var formStillVisible = !!(
        document.querySelector('input[name="title"], input[name="name"], input[id*="title" i]') &&
        (document.querySelector('textarea[name="description"], textarea[name="details"], textarea[id*="description" i]') ||
         document.querySelector('[contenteditable="true"]'))
      );

      var confirmationText = null;
      var successEl = document.querySelector('.success-message, .alert-success, [class*="congratul"]');
      if (successEl) {
        var t = (successEl.textContent || '').trim();
        if (t.length > 0) confirmationText = t.substring(0, 200);
      }

      return {
        canonicalUrl: (canonical && canonical.href) || null,
        ogUrl: (ogUrl && ogUrl.content) || null,
        listingIdFromMeta: metaIdMatch ? metaIdMatch[1] : null,
        pageTitle: document.title || '',
        successIndicators: successIndicators,
        errorIndicators: errorIndicators,
        formStillVisible: formStillVisible,
        confirmationText: confirmationText
      };
    `);

    return { urlBefore, urlAfter, urlChanged, listingIdFromUrl, ...dom };
  }

  private classifyPublishOutcome(s: PostSubmitSignals): ConnectorPublishResult {
    const baseMeta = {
      connector: 'lalafo',
      recoveryMode: 'selenium',
      submittedAt: new Date().toISOString(),
      postSubmitUrl: s.urlAfter,
      successSignals: s.successIndicators,
      errorSignals: s.errorIndicators,
      formStillVisible: s.formStillVisible,
    };

    if (s.formStillVisible && s.errorIndicators.length > 0) {
      throw new Error(`Form validation failed: ${s.errorIndicators.join(', ')}`);
    }

    if (s.errorIndicators.length > 0 && s.successIndicators.length === 0 && !s.listingIdFromUrl && !s.listingIdFromMeta) {
      throw new Error(`Publish error detected: ${s.errorIndicators.join(', ')}`);
    }

    const listingId = s.listingIdFromUrl ?? s.listingIdFromMeta;
    if (listingId) {
      const candidateUrl = s.listingIdFromUrl
        ? s.urlAfter
        : (s.canonicalUrl ?? s.ogUrl ?? null);
      const externalUrl = candidateUrl && candidateUrl.includes(listingId) ? candidateUrl : null;

      return {
        externalListingId: listingId,
        externalUrl,
        publishMetadata: { ...baseMeta, confidence: 'confirmed', strategy: 'listing_id_detected' },
      };
    }

    if (s.urlChanged && s.successIndicators.length > 0 && !s.formStillVisible) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: { ...baseMeta, confidence: 'likely', strategy: 'url_changed_with_success_signals', confirmationText: s.confirmationText },
      };
    }

    if (s.confirmationText && !s.formStillVisible) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: { ...baseMeta, confidence: 'likely', strategy: 'confirmation_text_detected', confirmationText: s.confirmationText },
      };
    }

    if (s.urlChanged && !s.formStillVisible && s.errorIndicators.length === 0) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: { ...baseMeta, confidence: 'uncertain', strategy: 'url_changed_no_confirmation' },
      };
    }

    if (!s.formStillVisible && s.errorIndicators.length === 0 && s.successIndicators.length > 0) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: { ...baseMeta, confidence: 'uncertain', strategy: 'form_gone_with_partial_signals' },
      };
    }

    if (s.formStillVisible) {
      throw new Error('Form still visible after submission — publish did not complete');
    }

    throw new Error(
      `Lalafo PUBLISH_OUTCOME_INCONCLUSIVE: url=${s.urlAfter} title=${JSON.stringify(s.pageTitle)} ` +
        `successSignals=${s.successIndicators.join(',') || 'none'} errorSignals=${s.errorIndicators.join(',') || 'none'} ` +
        `formStillVisible=${s.formStillVisible} listingIdUrl=${s.listingIdFromUrl ?? 'none'}`,
    );
  }

  private async trySubmit(driver: WebDriver): Promise<boolean> {
    const clicked = await this.tryClick(driver, [
      'button[type="submit"]',
      'input[type="submit"]',
      'button.submit-btn',
      'button.btn-primary',
      'button[class*="submit"]',
      'button[class*="publish"]',
      '[data-testid*="submit" i]',
      'form button[type="submit"]',
    ].join(', '));

    if (clicked) return true;

    return await driver.executeScript<boolean>(`
      var buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, [role="button"]'));
      var keywords = ['yerləşdir', 'yerlesdir', 'elan yerləşdir', 'dərc', 'göndər', 'gonder', 'davam', 'submit', 'опубликовать', 'publish', 'place'];
      for (var i = 0; i < buttons.length; i++) {
        var text = (buttons[i].textContent || buttons[i].value || '').trim().toLowerCase();
        if (keywords.some(function(k) { return text.includes(k); })) {
          try { buttons[i].scrollIntoView({ block: 'center', inline: 'nearest' }); } catch (e) {}
          buttons[i].click();
          return true;
        }
      }
      return false;
    `);
  }

  // =========================================================================
  //  Private — URL recovery helpers
  // =========================================================================

  private async searchUserListingsForMatch(
    driver: WebDriver,
    title: string,
    price: number | null,
    timeoutMs: number,
  ): Promise<string | null> {
    const navigated = await this.navigateToUserListings(driver, timeoutMs);
    if (!navigated) return null;

    const listingUrl = await driver.executeScript<string | null>(`
      var targetTitle = arguments[0].toLowerCase().trim();
      var targetPrice = arguments[1];

      var cards = document.querySelectorAll(
        '.ad-card, [class*="listing-item"], [class*="ad-item"], [class*="AdCard"], a[href*="/ads/"]'
      );

      var best = null;
      var bestScore = 0;

      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var titleEl = card.querySelector('[class*="title"], h3, h4, h5, p');
        if (!titleEl) {
          if (card.tagName === 'A') titleEl = card;
          else continue;
        }

        var cardTitle = (titleEl.textContent || '').trim().toLowerCase();
        if (!cardTitle) continue;

        var score = 0;
        if (cardTitle === targetTitle) score = 3;
        else if (cardTitle.includes(targetTitle) || targetTitle.includes(cardTitle)) score = 2;
        else {
          var words = targetTitle.split(/\\s+/);
          var matched = words.filter(function(w) { return w.length > 2 && cardTitle.includes(w); });
          if (matched.length >= Math.ceil(words.length * 0.6)) score = 1;
        }
        if (score === 0) continue;

        if (targetPrice !== null) {
          var priceEl = card.querySelector('[class*="price"]');
          if (priceEl) {
            var pt = (priceEl.textContent || '').replace(/[^\\d.,]/g, '');
            var cp = parseFloat(pt);
            if (!isNaN(cp) && Math.abs(cp - targetPrice) <= 1) score += 1;
          }
        }

        if (score > bestScore) {
          var link = card.tagName === 'A' ? card : card.querySelector('a[href*="/ads/"]');
          if (link && link.href) { best = link.href; bestScore = score; }
        }
      }
      return best;
    `, title, price);

    if (!listingUrl) {
      console.log('[lalafo] no matching listing found on user listings page');
      return null;
    }

    console.log(`[lalafo] matched listing on user page: ${listingUrl}`);
    await driver.get(listingUrl);
    await waitForPageLoad(driver, timeoutMs);
    return await this.extractPageUrl(driver, listingUrl);
  }

  private async navigateToUserListings(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    await driver.get(BASE_URL);
    await waitForPageLoad(driver, timeoutMs);

    const foundLink = await driver.executeScript<string | null>(`
      var links = Array.from(document.querySelectorAll('a'));
      var keywords = ['elanlarım', 'elanlarim', 'my ads', 'мои объявления'];
      for (var i = 0; i < links.length; i++) {
        var text = (links[i].textContent || '').trim().toLowerCase();
        var href = links[i].href || '';
        for (var k = 0; k < keywords.length; k++) {
          if (text.includes(keywords[k])) return links[i].href;
        }
        if (/\\/my-?ads|\\/profile\\/ads|\\/cabinet/.test(href)) return links[i].href;
      }
      return null;
    `);

    if (foundLink) {
      await driver.get(foundLink);
      await waitForPageLoad(driver, timeoutMs);
      const hasContent = await driver.executeScript<boolean>(`
        return !!(document.querySelector('.ad-card, [class*="listing-item"], [class*="AdCard"], a[href*="/ads/"]'));
      `);
      if (hasContent) return true;
    }

    const candidates = [
      `${BASE_URL}/profile/ads`,
      `${BASE_URL}/my-ads`,
      `${BASE_URL}/cabinet`,
    ];

    for (const url of candidates) {
      try {
        await driver.get(url);
        await waitForPageLoad(driver, timeoutMs);
        const has = await driver.executeScript<boolean>(`
          return !!(document.querySelector('.ad-card, [class*="listing-item"], [class*="AdCard"], a[href*="/ads/"]'));
        `);
        if (has) return true;
      } catch { continue; }
    }

    console.log('[lalafo] could not navigate to user listings page');
    return false;
  }

  private async extractPageUrl(driver: WebDriver, candidateUrl: string): Promise<string | null> {
    const pageData = await driver.executeScript<{
      canonicalUrl: string | null;
      ogUrl: string | null;
      currentUrl: string;
      title: string;
    }>(`
      return {
        canonicalUrl: document.querySelector('link[rel="canonical"]')?.href ?? null,
        ogUrl: document.querySelector('meta[property="og:url"]')?.content ?? null,
        currentUrl: window.location.href,
        title: document.title ?? ''
      };
    `);

    const pick = pageData.canonicalUrl ?? pageData.ogUrl ?? pageData.currentUrl;
    if (!pick.includes('lalafo.az')) {
      return null;
    }

    if (/404|not found|tapılmadı|tapilmadi/i.test(pageData.title)) {
      return null;
    }

    const looksLikeAdDetail = /listing-id-\d+|\/items\/\d+|\/ads\/[^/]+\/\d{5,}/i.test(pick);
    if (!looksLikeAdDetail) {
      return null;
    }

    const hasBody = await driver.executeScript<boolean>(`
      var body = (document.body && document.body.innerText) || '';
      return body.length > 120;
    `);

    return hasBody ? pick : null;
  }

  // =========================================================================
  //  Private — generic helpers
  // =========================================================================

  private async findFirstVisible(driver: WebDriver, selectors: string[]): Promise<WebElement | null> {
    for (const selector of selectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        for (const el of elements) {
          if (await el.isDisplayed()) return el;
        }
      } catch { continue; }
    }
    return null;
  }

  private async tryClick(driver: WebDriver, selector: string, waitMs?: number): Promise<boolean> {
    try {
      if (waitMs) {
        await driver.wait(until.elementLocated(By.css(selector)), waitMs);
      }
      const el = await driver.findElement(By.css(selector));
      if (await el.isDisplayed()) {
        await el.click();
        return true;
      }
    } catch { /* not found or not clickable */ }
    return false;
  }
}
