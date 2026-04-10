import * as fs from 'fs';
import * as path from 'path';
import { By, until, Key, type WebDriver, type WebElement } from 'selenium-webdriver';
import { BaseConnector, type ConnectorContext, type ConnectorPublishResult } from './baseConnector';
import {
  buildChromeDriver,
  getSeleniumTimeout,
  waitForPageLoad,
  injectSessionCookies,
  persistSessionCookies,
  invalidateSession,
} from './seleniumSession';
import type { TapazPayload } from '../mappers/platforms/tapazMapper';
import { selectCategoryPathWithVariants } from './categoryPathNav';
import { categoryPathVariantsForTapaz } from './platformCategoryLabels';
import { downloadImages, cleanupDownloadedImages, type DownloadResult } from '../utils/downloadImages';

const ENV_PREFIX = 'TAPAZ';
const BASE_URL = 'https://tap.az';
const LOGIN_URL = `${BASE_URL}/`;
const NEW_LISTING_URL = `${BASE_URL}/elanlar/new`;

const OTP_POLL_INTERVAL_MS = 2000;
const DEFAULT_OTP_TIMEOUT_MS = 120_000;

/** Origins that may hold Tap.az auth (cookies + Web storage). */
const TAPAZ_STORAGE_ORIGINS = ['https://tap.az', 'https://www.tap.az', 'https://hello.tap.az'] as const;

type ChromeWebDriver = WebDriver & {
  sendDevToolsCommand?(cmd: string, params?: Record<string, unknown>): Promise<void>;
};

/** Minimal CDP connection from selenium-webdriver createCDPConnection('page'). */
type TapazCdpConnection = {
  send(method: string, params?: Record<string, unknown>): Promise<unknown>;
  execute(method: string, params?: Record<string, unknown>, callback?: null): void;
};

type DriverWithCdp = WebDriver & {
  createCDPConnection(target: string): Promise<TapazCdpConnection>;
  _cdpWsConnection?: {
    on(event: string, listener: (data: Buffer | string) => void): void;
    off?(event: string, listener: (data: Buffer | string) => void): void;
    removeListener?(event: string, listener: (data: Buffer | string) => void): void;
  };
};

/** When true (default), OTP phone is forced via CDP Fetch; DOM mismatch does not block login. */
function tapazLoginFetchOverrideEnabled(): boolean {
  const v = process.env.TAPAZ_LOGIN_FETCH_OVERRIDE?.trim().toLowerCase();
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return true;
}

/** Log every tap.az POST/PUT/PATCH (full body) via CDP Fetch; does not modify requests. */
function tapazDebugRequestLogEnabled(): boolean {
  return envTruthy('TAPAZ_DEBUG_REQUEST_LOG');
}

function tapazHeadersShortForLog(
  headers: Record<string, unknown>,
): string {
  return Object.entries(headers || {})
    .map(([k, v]) => {
      const val = String(v);

      if (k.toLowerCase() === 'authorization' || k.toLowerCase() === 'cookie') {
        return `${k}: ${val.slice(0, 10)}...`;
      }

      return `${k}: ${val.slice(0, 50)}`;
    })
    .join(' | ');
}

function normalizeTapazPhoneComparable(raw: string): string {
  return String(raw ?? '')
    .normalize('NFKC')
    .replace(/[\s\u00A0\-()._]/g, '');
}

/** National mobile digits (9) after +994 for AZ typical numbers. */
function tapazNationalDigitsFromNormalized(plus994: string): string {
  const d = plus994.replace(/\D/g, '');
  if (d.startsWith('994') && d.length >= 11) return d.slice(3);
  return d.replace(/^0+/, '');
}

function formatTapazPayloadPhoneLikeOriginal(original: string, normalizedTargetPlus994: string): string {
  const o = original.trim();
  const national = tapazNationalDigitsFromNormalized(normalizedTargetPlus994);
  const withZero = national.length >= 9 ? `0${national.slice(-9)}` : o;
  const withPlus = national.length >= 9 ? `+994${national.slice(-9)}` : normalizedTargetPlus994;
  if (/^\+?\s*994/.test(o) || o.startsWith('+')) return withPlus;
  if (/^0[\d\s\-().]/.test(o) || (o.startsWith('0') && /\d{8,}/.test(o))) return withZero;
  const compact = o.replace(/\D/g, '');
  if (compact.startsWith('994')) return `994${national.slice(-9)}`;
  return normalizedTargetPlus994;
}

const TAPAZ_PHONE_FIELD_KEY_RE = /phone|mobile|msisdn|tel|login|username|msis|cell|number/i;

function rewriteTapazLoginRequestBody(
  decodedBody: string,
  contentType: string,
  normalizedTargetPlus994: string,
): { newBody: string; originalPhones: string[]; modified: boolean } {
  const targetNorm = normalizeTapazPhoneComparable(normalizedTargetPlus994);
  const originals: string[] = [];
  const ct = contentType.toLowerCase();

  const replaceValue = (val: string, key: string): string => {
    if (!val || val.length < 8) return val;
    const valNorm = normalizeTapazPhoneComparable(val);
    if (valNorm === targetNorm) return val;
    const looksAz =
      /^\+?994/.test(valNorm) ||
      (valNorm.startsWith('0') && valNorm.length >= 9) ||
      (/\d{9,}/.test(valNorm) && (TAPAZ_PHONE_FIELD_KEY_RE.test(key) || /^\+?994|^\d{10,}/.test(val.replace(/\s/g, ''))));
    if (!looksAz && !TAPAZ_PHONE_FIELD_KEY_RE.test(key)) return val;
    if (!/\d{7,}/.test(val)) return val;
    originals.push(val);
    return formatTapazPayloadPhoneLikeOriginal(val, normalizedTargetPlus994);
  };

  if (ct.includes('application/json') || (decodedBody.trim().startsWith('{') && decodedBody.includes('"'))) {
    try {
      const parsed = JSON.parse(decodedBody) as unknown;
      const visit = (node: unknown, keyPath: string): unknown => {
        if (typeof node === 'string') {
          return replaceValue(node, keyPath);
        }
        if (Array.isArray(node)) {
          return node.map((item, i) => visit(item, `${keyPath}[${i}]`));
        }
        if (node && typeof node === 'object') {
          const o = node as Record<string, unknown>;
          const out: Record<string, unknown> = {};
          for (const k of Object.keys(o)) {
            out[k] = visit(o[k], k);
          }
          return out;
        }
        return node;
      };
      const next = visit(parsed, '');
      const newBody = JSON.stringify(next);
      return {
        newBody,
        originalPhones: originals,
        modified: originals.length > 0,
      };
    } catch {
      // fall through to plain-text replace
    }
  }

  if (ct.includes('application/x-www-form-urlencoded') || (decodedBody.includes('=') && decodedBody.includes('&'))) {
    try {
      const params = new URLSearchParams(decodedBody);
      let modified = false;
      for (const key of [...new Set(Array.from(params.keys()))]) {
        const val = params.get(key);
        if (val == null) continue;
        const nv = replaceValue(val, key);
        if (nv !== val) {
          params.set(key, nv);
          modified = true;
        }
      }
      const newBody = params.toString();
      return { newBody, originalPhones: originals, modified };
    } catch {
      // fall through
    }
  }

  let newBody = decodedBody;
  const phoneLike = /\+?994[\d\s\-().]{8,}|0\d[\d\s\-().]{7,}/g;
  newBody = decodedBody.replace(phoneLike, (m) => {
    const n = normalizeTapazPhoneComparable(m);
    if (n === targetNorm) return m;
    originals.push(m);
    return formatTapazPayloadPhoneLikeOriginal(m, normalizedTargetPlus994);
  });
  return { newBody, originalPhones: originals, modified: newBody !== decodedBody };
}

function tapazUrlLooksLikeAuthOtp(url: string): boolean {
  try {
    const u = url.toLowerCase();
    if (!/tap\.az|hello\.tap\.az/.test(u)) return false;
    return /otp|sms|code|login|auth|session|verify|send|sign|token|laravel|sanctum|passport/i.test(u);
  } catch {
    return false;
  }
}

/** Empty = top document; [0] = first top-level iframe; [0,1] = nested iframe. */
export type TapAuthFramePath = number[];

/** hello.tap.az / tap.az login modals — broad list; best match chosen by visibility + modal. */
const TAPAZ_PHONE_INPUT_CSS = [
  'input[type="tel"]',
  'input[inputmode="tel"]',
  'input[name="phone"]',
  'input[name="mobile"]',
  'input[name="phoneNumber"]',
  'input[name="msisdn"]',
  'input[name="login"]',
  'input[id*="phone" i]',
  'input[id*="mobile" i]',
  'input[autocomplete="tel"]',
  'input[placeholder*="nömrə" i]',
  'input[placeholder*="telefon" i]',
  'input[placeholder*="phone" i]',
  'input[placeholder*="номер" i]',
  '.modal input[type="tel"]',
  '.modal input[type="text"]',
  '[role="dialog"] input[type="tel"]',
  '[role="dialog"] input[inputmode="tel"]',
  '.login-form input[type="tel"]',
  '.auth-form input[type="tel"]',
].join(', ');

// ---------------------------------------------------------------------------
//  Tap.az category display names → URL slugs used on the site
// ---------------------------------------------------------------------------
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'elektronika': 'elektronika',
  'nəqliyyat': 'neqliyyat',
  'avtomobillər': 'neqliyyat',
  'daşınmaz əmlak': 'dasinmaz-emlak',
  'ev və bağ üçün': 'ev-ve-bag-ucun',
  'şəxsi əşyalar': 'sexsi-esyalar',
  'iş elanları': 'is-elanlari',
  'uşaq aləmi': 'usaqlar-ucun',
  'heyvanlar': 'heyvanlar',
  'hobbi və asudə': 'hobbi-ve-asude',
  'xidmətlər və biznes': 'xidmetler',
};

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

function normalizeCategoryText(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Read once; trim + NFC + strip separators. AZ local 0XXXXXXXXX → +994XXXXXXXXX. */
function readTapazLoginPhoneFromEnv(): string | null {
  const raw = process.env.TAPAZ_LOGIN_PHONE;
  if (raw == null || !String(raw).trim()) {
    return null;
  }
  let s = String(raw).normalize('NFKC').trim();
  s = s.replace(/[\s\u00A0\-()._]/g, '');
  if (s.startsWith('0') && /^0\d{8,}$/.test(s)) {
    s = `+994${s.slice(1)}`;
  } else if (/^994\d{8,}$/.test(s)) {
    s = `+${s}`;
  }
  return s.length > 0 ? s : null;
}

function envTruthy(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function maskPhoneForLog(phone: string): string {
  if (phone.length <= 4) return '****';
  return `***${phone.slice(-4)} (len=${phone.length})`;
}

export class TapazConnector extends BaseConnector {
  constructor() {
    super('tapaz', 'Tap.az');
  }

  // -------------------------------------------------------------------------
  //  publishListing — real Selenium-based form submission
  // -------------------------------------------------------------------------
  async publishListing(payload: Record<string, unknown>, context?: ConnectorContext): Promise<ConnectorPublishResult> {
    const tapaz = payload as unknown as TapazPayload;
    const driver = await buildChromeDriver(ENV_PREFIX);
    const timeoutMs = getSeleniumTimeout(ENV_PREFIX);
    const userId = context?.userId;
    let imageDownload: DownloadResult | null = null;

    try {
      if (tapaz.images.length > 0) {
        console.log(`[tapaz] downloading ${tapaz.images.length} image(s)…`);
        imageDownload = await downloadImages(tapaz.images);
        if (imageDownload.skipped.length > 0) {
          console.log(`[tapaz] ${imageDownload.skipped.length} image(s) skipped`);
        }
      }

      await this.ensureAuthenticated(driver, timeoutMs, userId);

      await driver.get(NEW_LISTING_URL);
      await waitForPageLoad(driver, timeoutMs);

      await this.selectCategoryPath(driver, tapaz.categoryPath, timeoutMs);
      await this.fillListingForm(driver, tapaz, imageDownload, timeoutMs);
      const result = await this.submitAndExtractResult(driver, timeoutMs);

      result.publishMetadata = {
        ...result.publishMetadata,
        listingTitle: tapaz.title,
        listingPrice: tapaz.price,
        listingCity: tapaz.city,
      };

      if (userId) {
        await persistSessionCookies(driver, userId, this.platformId);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Tap.az publish failed: ${message}`);
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
    if (!result.externalListingId) {
      return null;
    }

    return `${BASE_URL}/elanlar/${result.externalListingId}`;
  }

  // -------------------------------------------------------------------------
  //  fetchListingUrl — Selenium URL recovery (two-strategy)
  // -------------------------------------------------------------------------
  override async fetchListingUrl(result: ConnectorPublishResult, context?: ConnectorContext): Promise<string | null> {
    const candidateUrl = this.getListingUrl(result);
    const meta = result.publishMetadata;
    const listingTitle = meta?.listingTitle ? String(meta.listingTitle) : null;
    const listingPrice = meta?.listingPrice != null ? Number(meta.listingPrice) : null;

    if (!candidateUrl && !listingTitle) {
      return null;
    }

    const driver = await buildChromeDriver(ENV_PREFIX);
    const timeoutMs = getSeleniumTimeout(ENV_PREFIX);
    const userId = context?.userId;

    try {
      await this.ensureAuthenticated(driver, timeoutMs, userId);

      // Strategy 1: direct navigation to candidate URL (when listing ID is known)
      if (candidateUrl) {
        await driver.get(candidateUrl);
        await waitForPageLoad(driver, timeoutMs);
        const url = await this.extractPageUrl(driver, candidateUrl);
        if (url) {
          console.log('[tapaz] recovery: resolved via direct URL');
          if (userId) await persistSessionCookies(driver, userId, this.platformId);
          return url;
        }
      }

      // Strategy 2: search user's listings page for a title/price match
      if (listingTitle && userId) {
        const url = await this.searchUserListingsForMatch(driver, listingTitle, listingPrice, timeoutMs);
        if (url) {
          console.log('[tapaz] recovery: resolved via user listings search');
          await persistSessionCookies(driver, userId, this.platformId);
          return url;
        }
      }

      if (userId) await persistSessionCookies(driver, userId, this.platformId);
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Tap.az Selenium recovery failed: ${message}`);
    } finally {
      await driver.quit().catch(() => undefined);
    }
  }

  // -------------------------------------------------------------------------
  //  normalizeError
  // -------------------------------------------------------------------------
  override normalizeError(error: unknown) {
    if (error instanceof Error) {
      if (error.message.startsWith('Tap.az publish failed:')) {
        return { code: 'TAPAZ_PUBLISH_ERROR', message: error.message };
      }

      if (error.message.includes('login failed') || error.message.includes('Session expired and login failed')) {
        return { code: 'TAPAZ_LOGIN_ERROR', message: error.message };
      }

      if (error.message.includes('Tap.az LOGIN_PHONE_INPUT_NOT_FOUND')) {
        return { code: 'TAPAZ_LOGIN_PHONE_INPUT_NOT_FOUND', message: error.message };
      }

      if (error.message.includes('Tap.az LOGIN_PHONE_VALUE_MISMATCH')) {
        return { code: 'TAPAZ_LOGIN_PHONE_VALUE_MISMATCH', message: error.message };
      }

      if (error.message.startsWith('Tap.az Selenium recovery failed:')) {
        return { code: 'TAPAZ_SELENIUM_RECOVERY_ERROR', message: error.message };
      }
    }

    return super.normalizeError(error);
  }

  // =========================================================================
  //  Private — authentication
  // =========================================================================

  private loginEnvHint(): string {
    return (
      'Set TAPAZ_LOGIN_PHONE (e.g. +994XXXXXXXXX), and TAPAZ_OTP_CODE or TAPAZ_OTP_FILE for OTP. ' +
      'If the site shows the wrong number on OTP, set TAPAZ_FORCE_FRESH_LOGIN=1 to skip DB cookies and log in with the env phone only. ' +
      'Alternatively persist session cookies for this user via a prior successful login.'
    );
  }

  private async countDriverCookies(driver: WebDriver): Promise<number> {
    try {
      const list = await driver.manage().getCookies();
      return list.length;
    } catch {
      return -1;
    }
  }

  /**
   * Full reset before env-based login: neutral page, CDP + JS storage wipe, cookie counts.
   * Root issue addressed: navigate-then-deleteAllCookies only touched one domain; localStorage /
   * sessionStorage / IndexedDB / cross-subdomain cookies kept the old Tap.az identity on OTP.
   */
  private async clearTapazBrowserCookies(driver: WebDriver, timeoutMs: number): Promise<void> {
    const perOriginTimeout = Math.min(Math.max(timeoutMs, 5000), 20000);
    const before = await this.countDriverCookies(driver);
    console.log(`[tapaz] session wipe: cookie count BEFORE clear: ${before}`);

    await driver.get('about:blank');
    try {
      await driver.sleep(400);
    } catch {
      // ignore
    }

    const chromeDriver = driver as ChromeWebDriver;
    if (typeof chromeDriver.sendDevToolsCommand === 'function') {
      try {
        await chromeDriver.sendDevToolsCommand('Network.clearBrowserCookies', {});
        for (const origin of TAPAZ_STORAGE_ORIGINS) {
          try {
            await chromeDriver.sendDevToolsCommand('Storage.clearDataForOrigin', {
              origin,
              storageTypes: 'all',
            });
          } catch {
            // hello.tap.az etc. may reject — continue
          }
        }
        console.log(
          '[tapaz] session wipe: CDP Network.clearBrowserCookies + Storage.clearDataForOrigin(all) for tap.az origins',
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`[tapaz] session wipe: CDP clear failed (continuing with WebDriver/JS): ${msg}`);
      }
    } else {
      console.log('[tapaz] session wipe: sendDevToolsCommand not available — WebDriver + in-page JS only');
    }

    try {
      await driver.manage().deleteAllCookies();
    } catch {
      // ignore
    }

    for (const origin of TAPAZ_STORAGE_ORIGINS) {
      try {
        await driver.get(`${origin}/`);
        await waitForPageLoad(driver, perOriginTimeout);
        await driver.executeScript(`
          try { window.localStorage && localStorage.clear(); } catch (e) {}
          try { window.sessionStorage && sessionStorage.clear(); } catch (e) {}
        `);
        await driver.executeAsyncScript(`
          var done = arguments[arguments.length - 1];
          (function () {
            try {
              if (!window.indexedDB || !indexedDB.databases) {
                done();
                return;
              }
              indexedDB.databases().then(function (dbs) {
                var pending = (dbs && dbs.length) ? dbs.length : 0;
                if (!pending) {
                  done();
                  return;
                }
                dbs.forEach(function (db) {
                  if (!db || !db.name) {
                    pending--;
                    if (pending <= 0) done();
                    return;
                  }
                  var req = indexedDB.deleteDatabase(db.name);
                  req.onsuccess = req.onerror = req.onblocked = function () {
                    pending--;
                    if (pending <= 0) done();
                  };
                });
              }).catch(function () { done(); });
            } catch (err) {
              done();
            }
          })();
        `);
      } catch {
        console.log(`[tapaz] session wipe: could not fully open ${origin} (offline/DNS) — skipped`);
      }
    }

    try {
      await driver.manage().deleteAllCookies();
    } catch {
      // ignore
    }

    await driver.get('about:blank');
    try {
      await driver.sleep(300);
    } catch {
      // ignore
    }

    const after = await this.countDriverCookies(driver);
    console.log(`[tapaz] session wipe: cookie count AFTER clear: ${after}`);

    let remainingTap: { name: string; domain?: string }[] = [];
    try {
      const all = await driver.manage().getCookies();
      remainingTap = all.filter(
        (c) =>
          (c.domain && /tap\.az/i.test(c.domain)) ||
          /session|token|auth|jwt|user|laravel|remember/i.test(c.name || ''),
      );
    } catch {
      // ignore
    }
    if (remainingTap.length > 0) {
      console.warn(
        `[tapaz] session wipe: WARNING — ${remainingTap.length} suspicious cookie(s) still in jar: ` +
          remainingTap.map((c) => `${c.name}@${c.domain ?? '?'}`).join(', '),
      );
      if (typeof chromeDriver.sendDevToolsCommand === 'function') {
        try {
          await chromeDriver.sendDevToolsCommand('Network.clearBrowserCookies', {});
          await driver.manage().deleteAllCookies();
          const retry = await this.countDriverCookies(driver);
          console.log(`[tapaz] session wipe: cookie count after CDP retry: ${retry}`);
        } catch {
          // ignore
        }
      }
    } else {
      console.log('[tapaz] session wipe: no tap.az / auth-like cookies remain in WebDriver cookie jar');
    }

    console.log(
      '[tapaz] session wipe: complete — performLogin will navigate to LOGIN_URL from a neutral about:blank state',
    );
  }

  private async ensureAuthenticated(driver: WebDriver, timeoutMs: number, userId?: string): Promise<void> {
    if (!userId) {
      console.warn('[tapaz] no userId in context — session injection skipped; listing form may require login');
      return;
    }

    const envPhone = readTapazLoginPhoneFromEnv();
    const phoneConfigured = envPhone != null;
    const forceFresh = envTruthy('TAPAZ_FORCE_FRESH_LOGIN');

    if (forceFresh && phoneConfigured) {
      console.log(
        '[tapaz] auth: TAPAZ_FORCE_FRESH_LOGIN=1 — skipping DB session injection; will use TAPAZ_LOGIN_PHONE only',
      );
      console.log(`[tapaz] auth: effective phone from env (normalized): ${maskPhoneForLog(envPhone)}`);
      await this.clearTapazBrowserCookies(driver, timeoutMs);
      const loggedIn = await this.performLogin(driver, timeoutMs, envPhone);
      if (loggedIn) {
        await persistSessionCookies(driver, userId, this.platformId);
        return;
      }
      throw new Error(`Tap.az: TAPAZ_FORCE_FRESH_LOGIN login failed. ${this.loginEnvHint()}`);
    }

    const session = await injectSessionCookies(driver, BASE_URL, userId, this.platformId);

    if (!session) {
      if (!phoneConfigured) {
        throw new Error(`Tap.az: no stored session for user and TAPAZ_LOGIN_PHONE is not set. ${this.loginEnvHint()}`);
      }
      console.log(`[tapaz] auth: no persisted session — env phone login; effective: ${maskPhoneForLog(envPhone!)}`);
      await this.clearTapazBrowserCookies(driver, timeoutMs);
      const loggedIn = await this.performLogin(driver, timeoutMs, envPhone!);
      if (loggedIn) {
        await persistSessionCookies(driver, userId, this.platformId);
        return;
      }
      throw new Error(`Tap.az: login failed (check TAPAZ_LOGIN_PHONE / OTP). ${this.loginEnvHint()}`);
    }

    console.log('[tapaz] auth: loaded persisted platform session from DB (cookies injected into driver)');

    await driver.get(BASE_URL);
    await waitForPageLoad(driver, timeoutMs);

    const valid = await this.isSessionValid(driver);

    if (valid) {
      if (phoneConfigured) {
        console.log(
          '[tapaz] auth: persisted session is VALID — TAPAZ_LOGIN_PHONE is NOT used (OTP/login flow skipped). ' +
            'To log in as the env number instead, set TAPAZ_FORCE_FRESH_LOGIN=1 or invalidate the stored session.',
        );
        console.log(
          `[tapaz] auth: (for reference) normalized TAPAZ_LOGIN_PHONE would be ${maskPhoneForLog(envPhone!)} but it was ignored`,
        );
      }
      return;
    }

    if (!phoneConfigured) {
      await invalidateSession(userId, this.platformId);
      throw new Error(
        `Tap.az: session cookies invalid/expired and TAPAZ_LOGIN_PHONE is not set. ${this.loginEnvHint()}`,
      );
    }

    console.warn(
      '[tapaz] auth: persisted session INVALID after cookie inject — clearing browser cookies then env-phone login',
    );
    console.log(`[tapaz] auth: effective phone from env (normalized): ${maskPhoneForLog(envPhone!)}`);
    await invalidateSession(userId, this.platformId);
    await this.clearTapazBrowserCookies(driver, timeoutMs);
    const loggedIn = await this.performLogin(driver, timeoutMs, envPhone!);
    if (loggedIn) {
      await persistSessionCookies(driver, userId, this.platformId);
      return;
    }
    throw new Error(`Tap.az: session expired and interactive login failed. ${this.loginEnvHint()}`);
  }

  private async isSessionValid(driver: WebDriver): Promise<boolean> {
    try {
      return await driver.executeScript<boolean>(`
        return !!(
          document.querySelector('.user-menu, .user-info, [data-user], .cabinet-link, .my-cabinet') ||
          document.querySelector('a[href*="/cabinet"], a[href*="/my"], a[href*="/profile"]') ||
          document.querySelector('.header .user, .navbar .user, [class*="logged-in"]')
        );
      `);
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  //  performLogin — real Selenium-based phone + OTP flow
  // -------------------------------------------------------------------------

  private async performLogin(driver: WebDriver, timeoutMs: number, phoneOverride?: string | null): Promise<boolean> {
    const phone = phoneOverride ?? readTapazLoginPhoneFromEnv();

    if (!phone) {
      console.log('[tapaz] TAPAZ_LOGIN_PHONE not configured — performLogin aborted (caller should validate env)');
      return false;
    }

    try {
      // Always land on Tap.az home from a deterministic navigation (wipe ends on about:blank).
      await driver.get(LOGIN_URL);
      await waitForPageLoad(driver, timeoutMs);

      const loginOpened = await this.openLoginForm(driver, timeoutMs);
      if (!loginOpened) {
        console.log('[tapaz] login form could not be opened');
        return false;
      }

      console.log(
        `[tapaz] login: submitting phone to Tap.az (normalized value, masked): ${maskPhoneForLog(phone)}`,
      );

      const runInteractiveLogin = async (): Promise<boolean> => {
        const authFramePath = await this.enterPhoneNumber(driver, phone, timeoutMs);
        const otpRequested = await this.submitPhoneForOtp(driver, timeoutMs, authFramePath, phone);
        if (!otpRequested) {
          console.log('[tapaz] could not submit phone number for OTP');
          return false;
        }

        const otp = await this.acquireOtpCode(phone);
        if (!otp) {
          console.log('[tapaz] OTP acquisition timed out or failed');
          return false;
        }

        const otpEntered = await this.enterOtpCode(driver, otp, timeoutMs, authFramePath);
        if (!otpEntered) {
          console.log('[tapaz] could not enter OTP code');
          return false;
        }

        await this.submitOtpVerification(driver, timeoutMs, authFramePath);
        return true;
      };

      let interactiveOk: boolean;
      if (tapazDebugRequestLogEnabled()) {
        console.log(
          '[tapaz][GLOBAL DEBUG REQUEST] TAPAZ_DEBUG_REQUEST_LOG=1 — ALL origins: POST/PUT/PATCH logged (full bodies); requests are NOT modified',
        );
        interactiveOk = await this.withTapazLoginFetchRequestDebug(driver, runInteractiveLogin);
      } else if (tapazLoginFetchOverrideEnabled()) {
        const fr = await this.withTapazLoginFetchPhoneOverride(driver, phone, runInteractiveLogin);
        interactiveOk = fr.runOk;
      } else {
        interactiveOk = await runInteractiveLogin();
      }

      if (!interactiveOk) {
        await driver.switchTo().defaultContent();
        return false;
      }

      await driver.switchTo().defaultContent();

      const success = await this.waitForLoginSuccess(driver, timeoutMs);
      if (!success) {
        console.log('[tapaz] login did not complete — session not valid after OTP');
        return false;
      }

      console.log('[tapaz] login successful');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Tap.az LOGIN_PHONE_')) {
        throw error instanceof Error ? error : new Error(msg);
      }
      console.log(`[tapaz] login failed: ${msg}`);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  //  Login sub-steps
  // -------------------------------------------------------------------------

  private async openLoginForm(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    const loginButtonClicked = await driver.executeScript<boolean>(`
      const links = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      const keywords = ['giriş', 'daxil ol', 'войти', 'login', 'sign in'];
      for (const el of links) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (keywords.some(k => text.includes(k))) {
          el.click();
          return true;
        }
      }
      const byHref = document.querySelector('a[href*="login"], a[href*="signin"], a[href*="daxil"]');
      if (byHref) { byHref.click(); return true; }
      return false;
    `);

    if (!loginButtonClicked) return false;

    try {
      await driver.wait(async () => {
        return await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('input[type="tel"], input[name="phone"], input[name="login"], input[placeholder*="nömrə" i], input[placeholder*="telefon" i]') ||
            document.querySelector('.modal.show, .modal[style*="display: block"], [class*="login-modal"], [class*="auth-modal"], .overlay.active')
          );
        `);
      }, timeoutMs);
    } catch {
      // The form may already be visible without explicit indication
    }

    return true;
  }

  private normalizePhoneInputValue(raw: string): string {
    return String(raw ?? '')
      .normalize('NFKC')
      .replace(/[\s\u00A0\-()._]/g, '');
  }

  private async switchToTapAuthPath(driver: WebDriver, path: TapAuthFramePath): Promise<void> {
    await driver.switchTo().defaultContent();
    for (const idx of path) {
      const frames = await driver.findElements(By.css('iframe'));
      if (idx < 0 || idx >= frames.length) {
        throw new Error(
          `Tap.az LOGIN_AUTH_FRAME_STALE: cannot switch to iframe index ${idx} (only ${frames.length} iframe(s) at this level)`,
        );
      }
      await driver.switchTo().frame(frames[idx]);
    }
  }

  /**
   * Logs iframe inventory on the current document (whatever frame driver is in).
   */
  private async logTapazIframeInventory(driver: WebDriver, label: string): Promise<void> {
    try {
      const rows = await driver.executeScript<{ index: number; src: string; id: string; name: string }[]>(`
        return Array.from(document.querySelectorAll('iframe')).map((f, i) => ({
          index: i,
          src: (f.getAttribute('src') || f.src || '') + '',
          id: (f.id || '') + '',
          name: (f.getAttribute('name') || '') + '',
        }));
      `);
      console.log(`[tapaz] auth frame: ${label} — iframe count=${rows.length}`);
      for (const r of rows) {
        console.log(
          `[tapaz] auth frame:   [${r.index}] id=${JSON.stringify(r.id)} name=${JSON.stringify(r.name)} src=${JSON.stringify(r.src.slice(0, 200))}`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`[tapaz] auth frame: ${label} — could not list iframes: ${msg}`);
    }
  }

  /**
   * Finds editable phone input in top document or inside nested iframes (depth ≤ 2).
   * Leaves WebDriver focused on the document that contains the matched input.
   */
  private async findPhoneInputInAuthFrames(
    driver: WebDriver,
  ): Promise<{ el: WebElement; path: TapAuthFramePath; pathLabel: string } | null> {
    await driver.switchTo().defaultContent();
    await this.logTapazIframeInventory(driver, 'top document (before phone search)');

    let el = await this.findBestTapazPhoneInput(driver);
    if (el) {
      console.log('[tapaz] auth frame: matched phone input in default/top document (no iframe)');
      return { el, path: [], pathLabel: 'root document' };
    }

    const topFrames = await driver.findElements(By.css('iframe'));
    for (let i = 0; i < topFrames.length; i++) {
      let topSrc = '';
      try {
        topSrc = (await topFrames[i].getAttribute('src')) ?? '';
      } catch {
        topSrc = '';
      }
      await driver.switchTo().defaultContent();
      const framesNow = await driver.findElements(By.css('iframe'));
      if (i >= framesNow.length) continue;
      await driver.switchTo().frame(framesNow[i]);
      await this.logTapazIframeInventory(driver, `inside top iframe[${i}] src~=${topSrc.slice(0, 80)}`);

      el = await this.findBestTapazPhoneInput(driver);
      if (el) {
        console.log(
          `[tapaz] auth frame: matched phone input in TOP iframe index=${i} src=${JSON.stringify(topSrc.slice(0, 160))}`,
        );
        return { el, path: [i], pathLabel: `iframe[${i}]` };
      }

      const innerFrames = await driver.findElements(By.css('iframe'));
      for (let j = 0; j < innerFrames.length; j++) {
        let innerSrc = '';
        try {
          innerSrc = (await innerFrames[j].getAttribute('src')) ?? '';
        } catch {
          innerSrc = '';
        }
        await driver.switchTo().defaultContent();
        const tf = await driver.findElements(By.css('iframe'));
        if (i >= tf.length) continue;
        await driver.switchTo().frame(tf[i]);
        const innerNow = await driver.findElements(By.css('iframe'));
        if (j >= innerNow.length) continue;
        await driver.switchTo().frame(innerNow[j]);
        await this.logTapazIframeInventory(driver, `nested iframe path [${i}][${j}] src~=${innerSrc.slice(0, 80)}`);

        el = await this.findBestTapazPhoneInput(driver);
        if (el) {
          console.log(
            `[tapaz] auth frame: matched phone input in NESTED iframe path=[${i}][${j}] innerSrc=${JSON.stringify(innerSrc.slice(0, 160))}`,
          );
          return { el, path: [i, j], pathLabel: `iframe[${i}][${j}]` };
        }
      }
    }

    await driver.switchTo().defaultContent();
    return null;
  }

  private async findBestTapazPhoneInput(driver: WebDriver): Promise<WebElement | null> {
    let elements: WebElement[];
    try {
      elements = await driver.findElements(By.css(TAPAZ_PHONE_INPUT_CSS));
    } catch {
      return null;
    }

    const visible: WebElement[] = [];
    for (const el of elements) {
      try {
        if (!(await el.isDisplayed())) continue;
        const editable = await driver.executeScript<boolean>(
          `
          const n = arguments[0];
          return !!(n && !n.disabled && !n.readOnly);
        `,
          el,
        );
        if (!editable) continue;
        visible.push(el);
      } catch {
        continue;
      }
    }

    for (const el of visible) {
      const inModal = await driver.executeScript<boolean>(
        `
        const n = arguments[0];
        if (!n || !n.closest) return false;
        return !!n.closest('[role="dialog"], .modal, [class*="Modal"], [class*="auth"], [class*="login"], [class*="Auth"]');
      `,
        el,
      );
      if (inModal) {
        return el;
      }
    }

    return visible[0] ?? null;
  }

  /**
   * Types TAPAZ_LOGIN_PHONE into the real phone field (top doc or iframe); verifies DOM value; throws on failure.
   * @returns frame path to re-use for OTP steps (same document context).
   */
  private async enterPhoneNumber(
    driver: WebDriver,
    phone: string,
    timeoutMs: number,
  ): Promise<TapAuthFramePath> {
    const debugFull = envTruthy('TAPAZ_DEBUG_LOGIN');
    console.log(
      `[tapaz] phone field: normalized env phone BEFORE type — len=${phone.length} suffix=***${phone.slice(-4)}` +
        (debugFull ? ` JSON=${JSON.stringify(phone)}` : ''),
    );

    try {
      await driver.wait(until.elementLocated(By.css(TAPAZ_PHONE_INPUT_CSS)), Math.min(timeoutMs, 20000));
    } catch {
      // continue — iframe search may still find the field
    }

    const found = await this.findPhoneInputInAuthFrames(driver);
    if (!found) {
      throw new Error(
        'Tap.az LOGIN_PHONE_INPUT_NOT_FOUND: no visible editable phone input in top document or iframes (depth≤2).',
      );
    }

    const { el, path, pathLabel } = found;
    console.log(`[tapaz] phone field: using auth document context ${pathLabel} path=${JSON.stringify(path)}`);

    await driver.executeScript(
      `
      const n = arguments[0];
      if (n && n.scrollIntoView) n.scrollIntoView({ block: 'center', inline: 'nearest' });
    `,
      el,
    );
    try {
      await driver.sleep(200);
    } catch {
      // ignore
    }

    await el.click();
    try {
      await driver.sleep(100);
    } catch {
      // ignore
    }

    const expectedNorm = this.normalizePhoneInputValue(phone);
    const maxAttempts = 4;
    const settleDelayMs = 400;
    let lastAfterDelay = '';
    let lastNorm = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let immediate = '';
      try {
        immediate = await driver.executeScript<string>(
          `
          const input = arguments[0];
          const phone = arguments[1];
          if (!input) return '';
          input.scrollIntoView({ block: 'center', inline: 'nearest' });
          input.focus();
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value',
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, phone);
          } else {
            input.value = phone;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return input.value != null ? String(input.value) : '';
        `,
          el,
          phone,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`[tapaz] phone field: React inject attempt ${attempt} script failed: ${msg}`);
        continue;
      }

      const immediateNorm = this.normalizePhoneInputValue(immediate);
      console.log(
        `[tapaz] phone field: (attempt ${attempt}) value IMMEDIATELY after native setter — raw=${JSON.stringify(immediate)} ` +
          `normalized=${JSON.stringify(immediateNorm)} expectedNormalized=${JSON.stringify(expectedNorm)}`,
      );

      try {
        await driver.sleep(settleDelayMs);
      } catch {
        // ignore
      }

      lastAfterDelay = await driver.executeScript<string>(
        `const n = arguments[0]; return n && n.value != null ? String(n.value) : '';`,
        el,
      );
      lastNorm = this.normalizePhoneInputValue(lastAfterDelay);
      const normalizedMatch = lastNorm === expectedNorm;

      console.log(
        `[tapaz] phone field: (attempt ${attempt}) value AFTER ${settleDelayMs}ms delay — raw=${JSON.stringify(lastAfterDelay)} ` +
          `normalized=${JSON.stringify(lastNorm)} expectedNormalized=${JSON.stringify(expectedNorm)} normalizedMatch=${normalizedMatch}`,
      );

      if (normalizedMatch) {
        console.log(
          `[tapaz] phone field: React/state accepted phone — DOM matches TAPAZ_LOGIN_PHONE after settle (context ${pathLabel}). ` +
            `Proceeding to Davam et only after this confirmation.`,
        );
        return path;
      }

      console.warn(
        `[tapaz] phone field: setter-only retry ${attempt}/${maxAttempts} — Tap.az may have reverted controlled input ` +
          `(finalNorm=${JSON.stringify(lastNorm)} expected=${JSON.stringify(expectedNorm)})`,
      );
    }

    if (tapazLoginFetchOverrideEnabled()) {
      console.warn(
        `[tapaz] phone field: DOM still mismatched after ${maxAttempts} attempts — continuing because TAPAZ_LOGIN_FETCH_OVERRIDE ` +
          `is enabled; outgoing login request will be rewritten to TAPAZ_LOGIN_PHONE (last DOM raw=${JSON.stringify(lastAfterDelay)}).`,
      );
      return path;
    }

    if (tapazDebugRequestLogEnabled()) {
      console.warn(
        '[tapaz] DEBUG MODE: ignoring phone mismatch and continuing to submit',
      );
      return path;
    }

    throw new Error(
      `Tap.az LOGIN_PHONE_VALUE_MISMATCH: after ${maxAttempts} native-setter-only attempts in ${pathLabel} — ` +
        `final DOM raw=${JSON.stringify(lastAfterDelay)} finalNormalized=${JSON.stringify(lastNorm)} ` +
        `expectedNormalized=${JSON.stringify(expectedNorm)}. Davam et was NOT sent.`,
    );
  }

  /**
   * CDP Fetch: log every POST/PUT/PATCH on any origin (no URL filter); do not modify; continueRequest unchanged.
   * Uses urlPattern "*" (CDP: matches all URLs). Markers in submitPhoneForOtp bracket the Davam et click for ordering.
   */
  private async withTapazLoginFetchRequestDebug(
    driver: WebDriver,
    run: () => Promise<boolean>,
  ): Promise<boolean> {
    const d = driver as DriverWithCdp;
    if (typeof d.createCDPConnection !== 'function') {
      console.warn(
        '[tapaz][GLOBAL DEBUG REQUEST] createCDPConnection not available — running login without CDP logging',
      );
      return run();
    }

    let conn: TapazCdpConnection;
    try {
      conn = await d.createCDPConnection('page');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[tapaz][GLOBAL DEBUG REQUEST] createCDPConnection failed — ${msg}`);
      return run();
    }

    const ws = d._cdpWsConnection;
    if (!ws || typeof ws.on !== 'function') {
      console.warn('[tapaz][GLOBAL DEBUG REQUEST] no CDP WebSocket on driver — running login without CDP logging');
      return run();
    }

    let seq = 0;
    const handler = (raw: Buffer | string) => {
      let message: { method?: string; params?: Record<string, unknown> };
      try {
        message = JSON.parse(String(raw)) as { method?: string; params?: Record<string, unknown> };
      } catch {
        return;
      }
      if (message.method !== 'Fetch.requestPaused') return;
      const params = message.params ?? {};
      const requestId = params.requestId as string | undefined;
      const req = params.request as
        | { url?: string; method?: string; postData?: string; headers?: Record<string, unknown> }
        | undefined;
      if (!requestId || !req) {
        return;
      }

      const url = req.url ?? '';
      const method = (req.method ?? 'GET').toUpperCase();
      const continuePlain = () => conn.execute('Fetch.continueRequest', { requestId }, null);

      if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
        continuePlain();
        return;
      }

      const postDataB64 = req.postData;
      let decoded = '';
      if (postDataB64 != null && postDataB64 !== '') {
        try {
          decoded = Buffer.from(postDataB64, 'base64').toString('utf8');
        } catch {
          decoded = postDataB64;
        }
      }

      const headers = req.headers ?? {};
      const headersShort = tapazHeadersShortForLog(headers);

      seq += 1;
      console.log(`[tapaz][GLOBAL DEBUG REQUEST] ========== #${seq} ==========`);
      console.log(`[tapaz][GLOBAL DEBUG REQUEST] method=${method}`);
      console.log(`[tapaz][GLOBAL DEBUG REQUEST] url=${url}`);
      console.log(`[tapaz][GLOBAL DEBUG REQUEST] headers_short=${headersShort}`);
      console.log(`[tapaz][GLOBAL DEBUG REQUEST] body (full UTF-8, decoded from CDP postData Base64):`);
      console.log(decoded === '' ? '(empty)' : decoded);
      console.log(`[tapaz][GLOBAL DEBUG REQUEST] ========== end #${seq} ==========`);

      continuePlain();
    };

    ws.on('message', handler);
    let runOk = false;
    try {
      // CDP: urlPattern "*" matches every URL (no domain restriction).
      await conn.send('Fetch.enable', {
        patterns: [{ urlPattern: '*', requestStage: 'Request' }],
        handleAuthRequests: false,
      });
      await conn.send('Network.setCacheDisabled', { cacheDisabled: true });
      console.log(
        '[tapaz][GLOBAL DEBUG REQUEST] Fetch enabled — intercepting POST/PUT/PATCH for all URLs (order: seq # vs Davam et markers below)',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[tapaz][GLOBAL DEBUG REQUEST] Fetch.enable failed — ${msg}`);
      if (typeof ws.off === 'function') ws.off('message', handler);
      else if (typeof ws.removeListener === 'function') ws.removeListener('message', handler);
      return run();
    }

    try {
      runOk = await run();
    } finally {
      try {
        await conn.send('Fetch.disable', {});
      } catch {
        // ignore
      }
      if (typeof ws.off === 'function') ws.off('message', handler);
      else if (typeof ws.removeListener === 'function') ws.removeListener('message', handler);
    }

    console.log(
      `[tapaz][GLOBAL DEBUG REQUEST] CDP Fetch session closed — logged ${seq} POST/PUT/PATCH request(s) (all domains)`,
    );
    return runOk;
  }

  /**
   * CDP Fetch: pause tap.az POST/PUT bodies, replace phone fields with TAPAZ_LOGIN_PHONE, continue request.
   */
  private async withTapazLoginFetchPhoneOverride(
    driver: WebDriver,
    normalizedPhonePlus994: string,
    run: () => Promise<boolean>,
  ): Promise<{ applied: boolean; url: string | null; originals: string[]; runOk: boolean }> {
    const result = {
      applied: false as boolean,
      url: null as string | null,
      originals: [] as string[],
      runOk: false,
    };
    const d = driver as DriverWithCdp;
    if (typeof d.createCDPConnection !== 'function') {
      console.warn('[tapaz] fetch override: createCDPConnection not available — skipping network rewrite');
      result.runOk = await run();
      return result;
    }

    let conn: TapazCdpConnection;
    try {
      conn = await d.createCDPConnection('page');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[tapaz] fetch override: createCDPConnection failed — ${msg}`);
      result.runOk = await run();
      return result;
    }

    const ws = d._cdpWsConnection;
    if (!ws || typeof ws.on !== 'function') {
      console.warn('[tapaz] fetch override: no CDP WebSocket on driver — skipping network rewrite');
      result.runOk = await run();
      return result;
    }

    const handler = (raw: Buffer | string) => {
      let message: { method?: string; params?: Record<string, unknown> };
      try {
        message = JSON.parse(String(raw)) as { method?: string; params?: Record<string, unknown> };
      } catch {
        return;
      }
      if (message.method !== 'Fetch.requestPaused') return;
      const params = message.params ?? {};
      const requestId = params.requestId as string | undefined;
      const req = params.request as
        | { url?: string; method?: string; postData?: string; headers?: { name: string; value: string }[] }
        | undefined;
      if (!requestId || !req) {
        return;
      }

      const url = req.url ?? '';
      const method = (req.method ?? 'GET').toUpperCase();
      const continuePlain = () => conn.execute('Fetch.continueRequest', { requestId }, null);

      if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
        continuePlain();
        return;
      }

      const postDataB64 = req.postData;
      if (postDataB64 == null || postDataB64 === '') {
        continuePlain();
        return;
      }

      let decoded = '';
      try {
        decoded = Buffer.from(postDataB64, 'base64').toString('utf8');
      } catch {
        decoded = postDataB64;
      }

      const headers = req.headers ?? [];
      const ct =
        headers.find((h) => h.name.toLowerCase() === 'content-type')?.value?.split(';')[0]?.trim() ?? '';

      const authLike = tapazUrlLooksLikeAuthOtp(url);
      const hasPhoneShape = /\d{8,}/.test(decoded) && /phone|mobile|msisdn|login|tel|994|^\s*\{/.test(decoded);
      if (!authLike && !hasPhoneShape) {
        continuePlain();
        return;
      }

      const { newBody, originalPhones, modified } = rewriteTapazLoginRequestBody(
        decoded,
        ct,
        normalizedPhonePlus994,
      );

      if (!modified || originalPhones.length === 0) {
        continuePlain();
        return;
      }

      const newB64 = Buffer.from(newBody, 'utf8').toString('base64');
      result.applied = true;
      result.url = url;
      result.originals = originalPhones;

      console.log(
        `[tapaz] fetch override: intercept ${method} ${url.slice(0, 220)}${url.length > 220 ? '…' : ''}`,
      );
      console.log(
        `[tapaz] fetch override: original payload phone snippet(s)=${originalPhones.map((s) => JSON.stringify(s)).join(', ')}`,
      );
      console.log(
        `[tapaz] fetch override: overridden to TAPAZ_LOGIN_PHONE (normalized)=${JSON.stringify(normalizeTapazPhoneComparable(normalizedPhonePlus994))} ` +
          `payload format preserved per field`,
      );
      console.log('[tapaz] fetch override: confirmation — continuing request with modified POST body (Base64 postData)');

      conn.execute('Fetch.continueRequest', { requestId, postData: newB64 }, null);
    };

    ws.on('message', handler);
    try {
      await conn.send('Fetch.enable', {
        patterns: [
          { urlPattern: '*://*.tap.az/*', requestStage: 'Request' },
          { urlPattern: '*://tap.az/*', requestStage: 'Request' },
          { urlPattern: '*://hello.tap.az/*', requestStage: 'Request' },
        ],
        handleAuthRequests: false,
      });
      await conn.send('Network.setCacheDisabled', { cacheDisabled: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[tapaz] fetch override: Fetch.enable failed — ${msg}`);
      if (typeof ws.off === 'function') ws.off('message', handler);
      else if (typeof ws.removeListener === 'function') ws.removeListener('message', handler);
      result.runOk = await run();
      return result;
    }

    try {
      result.runOk = await run();
    } finally {
      try {
        await conn.send('Fetch.disable', {});
      } catch {
        // ignore
      }
      if (typeof ws.off === 'function') ws.off('message', handler);
      else if (typeof ws.removeListener === 'function') ws.removeListener('message', handler);
    }

    if (result.applied) {
      console.log('[tapaz] fetch override: session complete — at least one login/OTP request body was rewritten');
    } else {
      console.log(
        '[tapaz] fetch override: no matching POST body was modified (Tap.az may use GET, GraphQL WS, or different host); OTP destination unverified',
      );
    }

    return result;
  }

  private async submitPhoneForOtp(
    driver: WebDriver,
    timeoutMs: number,
    authFramePath: TapAuthFramePath,
    _normalizedPhone: string,
  ): Promise<boolean> {
    await this.switchToTapAuthPath(driver, authFramePath);

    if (tapazDebugRequestLogEnabled()) {
      console.log(
        '[tapaz][GLOBAL DEBUG REQUEST] marker: BEFORE Davam et — next POST/PUT/PATCH seq #s are pre-submit unless async races',
      );
    }

    const submitted = await driver.executeScript<boolean>(`
      function clickVisible(btn) {
        try {
          btn.scrollIntoView({ block: 'center', inline: 'nearest' });
          btn.click();
          return true;
        } catch (e) {
          return false;
        }
      }
      const modal = document.querySelector('[role="dialog"], .modal, [class*="auth-modal"], [class*="login-modal"], [class*="AuthModal"]');
      const scope = modal || document.body;
      const buttons = Array.from(scope.querySelectorAll('button, input[type="submit"], [role="button"]'));
      const ordered = [
        'davam et', 'davam', 'next', 'göndər', 'gonder', 'gönder',
        'send', 'continue', 'далее', 'отправить', 'daxil et'
      ];
      for (const kw of ordered) {
        for (const btn of buttons) {
          const text = (btn.textContent || btn.value || '').trim().toLowerCase().replace(/\\s+/g, ' ');
          if (text.includes(kw) && clickVisible(btn)) return true;
        }
      }
      const submitBtn = scope.querySelector('button[type="submit"], input[type="submit"], form button[type="submit"]');
      if (submitBtn && clickVisible(submitBtn)) return true;
      return false;
    `);

    if (tapazDebugRequestLogEnabled()) {
      console.log(
        `[tapaz][GLOBAL DEBUG REQUEST] marker: AFTER Davam et click (submitted=${submitted}) — following seq #s likely include OTP/phone API`,
      );
    }

    if (!submitted) {
      console.log('[tapaz] submit phone: no Davam/Next/submit control clicked in login modal scope');
      return false;
    }

    // Wait for OTP input to appear (indicates server accepted the phone number)
    try {
      await driver.wait(async () => {
        return await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('input[name="code"], input[name="otp"], input[name="sms_code"], input[name="verification_code"]') ||
            document.querySelector('input[maxlength="4"], input[maxlength="5"], input[maxlength="6"]') ||
            document.querySelectorAll('input[maxlength="1"]').length >= 4
          );
        `);
      }, timeoutMs);
    } catch {
      // OTP field may not appear in expected time, but let's continue
      console.log('[tapaz] OTP input field not detected — continuing with OTP acquisition');
    }

    return true;
  }

  private async enterOtpCode(
    driver: WebDriver,
    otp: string,
    _timeoutMs: number,
    authFramePath: TapAuthFramePath,
  ): Promise<boolean> {
    await this.switchToTapAuthPath(driver, authFramePath);

    // Case 1: split digit inputs (one char per field)
    const splitInputs = await driver.findElements(By.css('input[maxlength="1"]'));
    const visibleSplitInputs: WebElement[] = [];

    for (const el of splitInputs) {
      try {
        if (await el.isDisplayed()) visibleSplitInputs.push(el);
      } catch {
        // skip
      }
    }

    if (visibleSplitInputs.length >= 4 && visibleSplitInputs.length <= 8) {
      for (let i = 0; i < Math.min(otp.length, visibleSplitInputs.length); i++) {
        await visibleSplitInputs[i].clear();
        await visibleSplitInputs[i].sendKeys(otp[i]);
      }
      return true;
    }

    // Case 2: single OTP input field
    const otpInput = await this.findFirstVisible(driver, [
      'input[name="code"]',
      'input[name="otp"]',
      'input[name="sms_code"]',
      'input[name="verification_code"]',
      'input[maxlength="4"]',
      'input[maxlength="5"]',
      'input[maxlength="6"]',
      'input[placeholder*="kod" i]',
      'input[placeholder*="code" i]',
      'input[placeholder*="OTP" i]',
      'input[placeholder*="SMS" i]',
      'input[type="tel"]:not([name="phone"])',
      '.otp-input input',
      '.code-input input',
    ]);

    if (!otpInput) return false;

    await otpInput.clear();
    await otpInput.sendKeys(otp);
    return true;
  }

  private async submitOtpVerification(
    driver: WebDriver,
    timeoutMs: number,
    authFramePath: TapAuthFramePath,
  ): Promise<void> {
    await this.switchToTapAuthPath(driver, authFramePath);

    // Some forms auto-submit after OTP entry; try explicit submit as well
    await driver.executeScript(`
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
      const keywords = ['təsdiq', 'daxil', 'giriş', 'verify', 'confirm', 'подтвердить', 'ok', 'göndər'];
      for (const btn of buttons) {
        const text = (btn.textContent || btn.value || '').trim().toLowerCase();
        if (keywords.some(k => text.includes(k))) {
          btn.click();
          return;
        }
      }
      const formBtn = document.querySelector('form button[type="submit"], form input[type="submit"]');
      if (formBtn) formBtn.click();
    `);

    // Brief wait for the submission to process
    try {
      await driver.sleep(Math.min(timeoutMs, 3000));
    } catch {
      // ignore
    }
  }

  private async waitForLoginSuccess(driver: WebDriver, timeoutMs: number): Promise<boolean> {
    try {
      await driver.wait(async () => {
        const pageReady = await driver.executeScript<string>('return document.readyState');
        if (pageReady !== 'complete') return false;
        return await this.isSessionValid(driver);
      }, timeoutMs);
      return true;
    } catch {
      // One more attempt after a page reload
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
    const staticOtp = process.env.TAPAZ_OTP_CODE?.trim();
    if (staticOtp && /^\d{4,6}$/.test(staticOtp)) {
      console.log('[tapaz] using OTP from TAPAZ_OTP_CODE env var');
      return staticOtp;
    }

    return this.pollOtpFromFile(phone);
  }

  private async pollOtpFromFile(phone: string): Promise<string | null> {
    const otpFilePath = process.env.TAPAZ_OTP_FILE?.trim()
      || path.join(process.cwd(), '.tapaz-otp');
    const otpTimeoutMs = Number(process.env.TAPAZ_OTP_TIMEOUT_MS) || DEFAULT_OTP_TIMEOUT_MS;

    try {
      fs.writeFileSync(otpFilePath, 'WAITING', 'utf-8');
    } catch (err) {
      console.log(`[tapaz] could not write OTP file at ${otpFilePath}: ${err}`);
      return null;
    }

    console.log('─'.repeat(60));
    console.log(`[tapaz] OTP required for phone: ${phone}`);
    console.log(`[tapaz] Write the OTP code to: ${otpFilePath}`);
    console.log(`[tapaz] Timeout: ${Math.round(otpTimeoutMs / 1000)}s`);
    console.log(`[tapaz] Example: echo 1234 > "${otpFilePath}"`);
    console.log('─'.repeat(60));

    const deadline = Date.now() + otpTimeoutMs;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, OTP_POLL_INTERVAL_MS));

      try {
        const content = fs.readFileSync(otpFilePath, 'utf-8').trim();
        const match = content.match(/^(\d{4,6})$/);
        if (match) {
          console.log('[tapaz] OTP code received from file');
          try { fs.unlinkSync(otpFilePath); } catch { /* ignore cleanup error */ }
          return match[1];
        }
      } catch {
        // file may have been deleted or inaccessible
      }
    }

    console.log('[tapaz] OTP timeout — no code received');
    try { fs.unlinkSync(otpFilePath); } catch { /* ignore */ }
    return null;
  }

  // =========================================================================
  //  Private — category selection (explicit path only; no subcategory guessing)
  // =========================================================================

  private async selectCategoryPath(driver: WebDriver, path: string[], timeoutMs: number): Promise<void> {
    if (path.length === 0) {
      throw new Error('Tap.az categoryPath is empty — mapping must supply full navigation path');
    }

    const segmentVariants = categoryPathVariantsForTapaz(path);
    const [first, ...rest] = path;
    const normalizedRoot = normalizeCategoryText(first);
    const slug = CATEGORY_SLUG_MAP[normalizedRoot];

    if (slug) {
      const categoryLinkSelector = `a[href*="/${slug}"], a[href*="/new/${slug}"]`;
      const found = await this.tryClick(driver, categoryLinkSelector, timeoutMs);
      if (found) {
        await waitForPageLoad(driver, timeoutMs);
      } else {
        await selectCategoryPathWithVariants(driver, [segmentVariants[0]], timeoutMs, 'tapaz');
      }
    } else {
      await selectCategoryPathWithVariants(driver, [segmentVariants[0]], timeoutMs, 'tapaz');
    }

    if (rest.length > 0) {
      await selectCategoryPathWithVariants(driver, segmentVariants.slice(1), timeoutMs, 'tapaz');
    }
  }

  // =========================================================================
  //  Private — form filling
  // =========================================================================

  private async fillListingForm(
    driver: WebDriver,
    payload: TapazPayload,
    imageDownload: DownloadResult | null,
    timeoutMs: number,
  ): Promise<void> {
    await this.waitForFormReady(driver, timeoutMs);

    await this.fillFieldRequired(
      driver,
      'title',
      payload.title,
      [
        'input[name="title"]',
        'input#title',
        'input[name="ad_title"]',
        'input[name="listing[title]"]',
        'input[id*="title" i]',
        'input[placeholder*="başlıq" i]',
        'input[placeholder*="Başlıq"]',
        'input[aria-label*="başlıq" i]',
        'input[placeholder*="ad" i]',
        '.field-title input',
        '[data-testid*="title" i]',
      ],
    );

    await this.fillTextFieldRequired(
      driver,
      'description',
      payload.description,
      [
        'textarea[name="description"]',
        'textarea#description',
        'textarea[name="ad_description"]',
        'textarea[name="listing[description]"]',
        'textarea[id*="description" i]',
        'textarea[placeholder*="təsvir" i]',
        'textarea[placeholder*="Təsvir"]',
        'textarea[aria-label*="təsvir" i]',
        '.field-description textarea',
        '[contenteditable="true"]',
      ],
    );

    await this.fillFieldRequired(
      driver,
      'price',
      String(payload.price),
      [
        'input[name="price"]',
        'input#price',
        'input[name="ad_price"]',
        'input[name="listing[price]"]',
        'input[id*="price" i]',
        'input[type="number"]',
        'input[inputmode="numeric"]',
        'input[placeholder*="qiymət" i]',
        'input[placeholder*="Qiymət"]',
        'input[aria-label*="qiymət" i]',
        '.field-price input',
        '[data-testid*="price" i]',
      ],
    );

    await this.selectCity(driver, payload.city);

    if (imageDownload && imageDownload.images.length > 0) {
      await this.uploadImages(driver, imageDownload);
    }
  }

  private async waitForFormReady(driver: WebDriver, timeoutMs: number): Promise<void> {
    try {
      await driver.wait(async () => {
        const hasForm = await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('form') ||
            document.querySelector('input[name="title"], input[name="ad_title"]') ||
            document.querySelector('textarea[name="description"], textarea[name="ad_description"]') ||
            document.querySelector('input[name="price"], input[name="ad_price"]')
          );
        `);
        return hasForm;
      }, timeoutMs);
    } catch {
      console.log('[tapaz] form detection timed out — attempting to fill anyway');
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
        `Tap.az FORM_FIELD_NOT_FOUND: "${logicalName}" — no visible input matched (${selectors.slice(0, 4).join(', ')}…)`,
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
        `Tap.az FORM_FIELD_NOT_FOUND: "${logicalName}" — no visible field matched (${selectors.slice(0, 4).join(', ')}…)`,
      );
    }
    const tag = await element.getTagName();
    if (tag === 'div' || tag === 'span') {
      await driver.executeScript(
        'arguments[0].innerText = arguments[1]; arguments[0].dispatchEvent(new Event("input", {bubbles:true}));',
        element,
        value,
      );
    } else {
      await element.clear();
      await element.sendKeys(value);
    }
  }

  private async fillField(driver: WebDriver, value: string, selectors: string[]): Promise<void> {
    const element = await this.findFirstVisible(driver, selectors);

    if (!element) {
      console.log(`[tapaz] could not find field — tried: ${selectors[0]}…`);
      return;
    }

    await element.clear();
    await element.sendKeys(value);
  }

  private async fillTextField(driver: WebDriver, value: string, selectors: string[]): Promise<void> {
    const element = await this.findFirstVisible(driver, selectors);

    if (!element) {
      console.log(`[tapaz] could not find text field — tried: ${selectors[0]}…`);
      return;
    }

    const tag = await element.getTagName();

    if (tag === 'div' || tag === 'span') {
      await driver.executeScript(
        'arguments[0].innerText = arguments[1]; arguments[0].dispatchEvent(new Event("input", {bubbles:true}));',
        element,
        value,
      );
    } else {
      await element.clear();
      await element.sendKeys(value);
    }
  }

  private async selectCity(driver: WebDriver, city: string): Promise<void> {
    const selected = await driver.executeScript<boolean>(`
      const selects = document.querySelectorAll('select[name="city"], select[name="region"], select[name="location"], select#city');
      for (const select of selects) {
        for (const option of select.options) {
          if (option.text.trim().toLowerCase().includes(arguments[0].toLowerCase())) {
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }

      const buttons = document.querySelectorAll('[class*="city"] button, [class*="city"] a, [class*="location"] button');
      for (const btn of buttons) {
        if ((btn.textContent || '').trim().toLowerCase().includes(arguments[0].toLowerCase())) {
          btn.click();
          return true;
        }
      }

      return false;
    `, city);

    if (!selected) {
      console.log(`[tapaz] city "${city}" selector not matched — form may use default`);
    }
  }

  private async uploadImages(driver: WebDriver, download: DownloadResult): Promise<void> {
    const localPaths = download.images.map((img) => img.localPath);

    if (localPaths.length === 0) {
      console.log('[tapaz] no local images to upload');
      return;
    }

    try {
      // Find all file inputs (visible + hidden — file inputs are often hidden)
      const fileInputs = await driver.findElements(By.css(
        'input[type="file"], input[accept*="image"], .photo-upload input[type="file"], [class*="upload"] input[type="file"]',
      ));

      if (fileInputs.length === 0) {
        console.log('[tapaz] no file input found on page — skipping image upload');
        return;
      }

      // Use the first file input (make it interactable if hidden)
      const fileInput = fileInputs[0];

      await driver.executeScript(
        'arguments[0].style.display = "block"; arguments[0].style.visibility = "visible"; arguments[0].style.opacity = "1"; arguments[0].style.height = "auto"; arguments[0].style.width = "auto"; arguments[0].style.position = "static";',
        fileInput,
      );

      // Check if input accepts multiple files
      const acceptsMultiple = await fileInput.getAttribute('multiple');

      if (acceptsMultiple !== null) {
        // Single sendKeys call with all paths joined by newline
        const allPaths = localPaths.join('\n');
        await fileInput.sendKeys(allPaths);
        console.log(`[tapaz] uploaded ${localPaths.length} image(s) via multi-file input`);
      } else {
        // Single-file input: upload the first image
        await fileInput.sendKeys(localPaths[0]);
        console.log(`[tapaz] uploaded 1 image via single-file input`);

        // Try to upload remaining images one at a time via additional file inputs
        for (let i = 1; i < localPaths.length; i++) {
          try {
            // Wait briefly for the upload widget to refresh
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
                  console.log(`[tapaz] uploaded image ${i + 1}/${localPaths.length}`);
                  break;
                }
              } catch {
                continue;
              }
            }

            if (!uploaded) {
              console.log(`[tapaz] no available file input for image ${i + 1} — stopping at ${i} image(s)`);
              break;
            }
          } catch {
            console.log(`[tapaz] failed to upload image ${i + 1} — stopping`);
            break;
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`[tapaz] image upload error: ${msg} — continuing without images`);
    }
  }

  // =========================================================================
  //  Private — form submission & result extraction
  // =========================================================================

  private async submitAndExtractResult(driver: WebDriver, timeoutMs: number): Promise<ConnectorPublishResult> {
    const urlBefore = await driver.getCurrentUrl();

    const submitted = await this.trySubmit(driver);
    if (!submitted) {
      throw new Error(
        'Tap.az FORM_SUBMIT_NOT_FOUND: no submit control matched (button[type=submit], primary CTA, or keywords yerləşdir/dərc/publish)',
      );
    }

    // Phase 1 — wait for the page to react (URL change, DOM change, or timeout)
    await this.waitForSubmitResponse(driver, urlBefore, timeoutMs);

    // Phase 2 — collect all available signals from the post-submit page
    const signals = await this.collectPostSubmitSignals(driver, urlBefore);

    // Phase 3 — classify the outcome based on collected signals
    return this.classifyPublishOutcome(signals);
  }

  // -------------------------------------------------------------------------
  //  Phase 1: wait for page to react after submit
  // -------------------------------------------------------------------------

  private async waitForSubmitResponse(
    driver: WebDriver,
    urlBefore: string,
    timeoutMs: number,
  ): Promise<void> {
    // Brief initial pause for any AJAX / redirect to begin
    await driver.sleep(1500);

    const remaining = Math.max(timeoutMs - 1500, 3000);

    try {
      await driver.wait(async () => {
        return await driver.executeScript<boolean>(`
          if (window.location.href !== arguments[0]) return true;
          if (document.querySelector('.success-message, .alert-success, [class*="congratul"]'))
            return true;
          if (document.querySelector('.error-message, .alert-danger, .alert-error, .field-error, .form-error'))
            return true;
          var formFields = document.querySelectorAll(
            'input[name="title"], input[name="ad_title"], input[id*="title" i], textarea[name="description"], textarea[name="ad_description"]'
          );
          if (formFields.length === 0) return true;
          return false;
        `, urlBefore);
      }, remaining);
    } catch {
      // Timeout is not fatal — we'll analyze whatever state we're in
    }

    await waitForPageLoad(driver, Math.min(timeoutMs, 5000)).catch(() => undefined);
  }

  // -------------------------------------------------------------------------
  //  Phase 2: collect all signals from the post-submit page
  // -------------------------------------------------------------------------

  private async collectPostSubmitSignals(
    driver: WebDriver,
    urlBefore: string,
  ): Promise<PostSubmitSignals> {
    const urlAfter = await driver.getCurrentUrl();
    const urlChanged = urlAfter !== urlBefore;

    // Require /elanlar/{id} so we do not treat unrelated numeric path segments as listing ids.
    const urlIdMatch = urlAfter.match(/\/elanlar\/(\d{6,})(?:\/|[?#]|$)/);
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
      var metaIdMatch = metaUrl.match(/\\/elanlar\\/(\\d{6,})(?:\\/|[\\/?#]|$)/);

      var body = (document.body && document.body.innerText) || '';
      var bodyLower = body.substring(0, 2000);

      var successIndicators = [];
      if (/elan[ıi]n[ıi]z.*yerləşdiril/i.test(bodyLower)) successIndicators.push('az_listing_published');
      if (/elan.*uğurla/i.test(bodyLower)) successIndicators.push('az_success_ugurla');
      if (/elan.*əlavə.*edildi/i.test(bodyLower)) successIndicators.push('az_listing_added');
      if (/successfully.*publish/i.test(bodyLower)) successIndicators.push('en_published');
      if (/объявление.*опубликовано/i.test(bodyLower)) successIndicators.push('ru_published');
      if (document.querySelector('.success-message, .alert-success')) successIndicators.push('success_element');
      if (document.querySelector('[class*="congratul"]')) successIndicators.push('congratulation_element');
      if (document.querySelector('.listing-created, .publish-success, .ad-created')) successIndicators.push('specific_success_class');

      var errorIndicators = [];
      if (document.querySelector('.error-message, .alert-danger, .alert-error')) errorIndicators.push('error_element');
      if (document.querySelector('.field-error, .form-error, .validation-error, [class*="field-error"]')) errorIndicators.push('validation_error');
      if (document.querySelector('.form-group.has-error, .field.error, input.error, textarea.error')) errorIndicators.push('form_field_error');
      if (/xəta|səhv|uğursuz/i.test(bodyLower)) errorIndicators.push('az_error_text');
      if (/doldurun|tələb.*olunur|boş.*burax/i.test(bodyLower)) errorIndicators.push('az_validation_text');
      if (/(?:^|\\W)error(?:\\W|$)|failed|required field/i.test(bodyLower)) errorIndicators.push('en_error_text');
      if (/ошибка|не удалось|обязательное/i.test(bodyLower)) errorIndicators.push('ru_error_text');

      var formStillVisible = !!(
        document.querySelector('input[name="title"], input[name="ad_title"], input[id*="title" i]') &&
        document.querySelector('textarea[name="description"], textarea[name="ad_description"], textarea[id*="description" i]')
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

    return {
      urlBefore,
      urlAfter,
      urlChanged,
      listingIdFromUrl,
      ...dom,
    };
  }

  // -------------------------------------------------------------------------
  //  Phase 3: classify outcome based on collected signals
  // -------------------------------------------------------------------------

  private classifyPublishOutcome(s: PostSubmitSignals): ConnectorPublishResult {
    const baseMeta = {
      connector: 'tapaz',
      recoveryMode: 'selenium',
      submittedAt: new Date().toISOString(),
      postSubmitUrl: s.urlAfter,
      successSignals: s.successIndicators,
      errorSignals: s.errorIndicators,
      formStillVisible: s.formStillVisible,
    };

    // --- DEFINITE FAILURE: form still visible + error indicators ---
    if (s.formStillVisible && s.errorIndicators.length > 0) {
      throw new Error(
        `Form validation failed: ${s.errorIndicators.join(', ')}`,
      );
    }

    // --- DEFINITE FAILURE: errors with no success signals and no listing ID ---
    if (s.errorIndicators.length > 0 && s.successIndicators.length === 0 && !s.listingIdFromUrl && !s.listingIdFromMeta) {
      throw new Error(
        `Publish error detected: ${s.errorIndicators.join(', ')}`,
      );
    }

    // --- CONFIRMED SUCCESS: listing ID found in URL or meta ---
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

    // --- LIKELY SUCCESS: URL changed + success indicators + form gone ---
    if (s.urlChanged && s.successIndicators.length > 0 && !s.formStillVisible) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: {
          ...baseMeta,
          confidence: 'likely',
          strategy: 'url_changed_with_success_signals',
          confirmationText: s.confirmationText,
        },
      };
    }

    // --- LIKELY SUCCESS: explicit confirmation text + form gone ---
    if (s.confirmationText && !s.formStillVisible) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: {
          ...baseMeta,
          confidence: 'likely',
          strategy: 'confirmation_text_detected',
          confirmationText: s.confirmationText,
        },
      };
    }

    // --- UNCERTAIN SUCCESS: URL changed, form gone, no errors ---
    if (s.urlChanged && !s.formStillVisible && s.errorIndicators.length === 0) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: { ...baseMeta, confidence: 'uncertain', strategy: 'url_changed_no_confirmation' },
      };
    }

    // --- UNCERTAIN SUCCESS: form disappeared, no errors ---
    if (!s.formStillVisible && s.errorIndicators.length === 0 && s.successIndicators.length > 0) {
      return {
        externalListingId: undefined,
        externalUrl: null,
        publishMetadata: { ...baseMeta, confidence: 'uncertain', strategy: 'form_gone_with_partial_signals' },
      };
    }

    // --- FAILURE: form still visible, no success signals ---
    if (s.formStillVisible) {
      throw new Error('Form still visible after submission — publish did not complete');
    }

    // --- FAILURE: no meaningful signals ---
    throw new Error(
      `Tap.az PUBLISH_OUTCOME_INCONCLUSIVE: url=${s.urlAfter} title=${JSON.stringify(s.pageTitle)} ` +
        `successSignals=${s.successIndicators.join(',') || 'none'} errorSignals=${s.errorIndicators.join(',') || 'none'} ` +
        `formStillVisible=${s.formStillVisible}`,
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
      'button[class*="Save"]',
      '[data-testid*="submit" i]',
      '.form-actions button',
      'form button[type="submit"]',
    ].join(', '));

    if (clicked) return true;

    return await driver.executeScript<boolean>(`
      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a.btn, [role="button"]'));
      const keywords = [
        'yerləşdir', 'yerlesdir', 'elan', 'elanı', 'dərc', 'drc', 'göndər', 'gonder',
        'yadda saxla', 'davam', 'submit', 'опубликовать', 'publish', 'save', 'place'
      ];
      for (const btn of buttons) {
        const text = (btn.textContent || btn.value || '').trim().toLowerCase();
        if (keywords.some(k => text.includes(k))) {
          try {
            btn.scrollIntoView({ block: 'center', inline: 'nearest' });
          } catch (e) {}
          btn.click();
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
        '.products-i, .lot-listing, .ad-card, [class*="listing-item"], [class*="ad-item"]'
      );

      if (cards.length === 0) {
        cards = document.querySelectorAll('a[href*="/elanlar/"]');
      }

      var best = null;
      var bestScore = 0;

      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var titleEl = card.querySelector(
          '.products-name, .ad-title, [class*="title"], h3, h4, h5, .lot-title'
        );
        if (!titleEl) {
          if (card.tagName === 'A') {
            titleEl = card;
          } else continue;
        }

        var cardTitle = (titleEl.textContent || '').trim().toLowerCase();
        if (!cardTitle) continue;

        var score = 0;
        if (cardTitle === targetTitle) {
          score = 3;
        } else if (cardTitle.includes(targetTitle) || targetTitle.includes(cardTitle)) {
          score = 2;
        } else {
          var targetWords = targetTitle.split(/\\s+/);
          var matchedWords = targetWords.filter(function(w) {
            return w.length > 2 && cardTitle.includes(w);
          });
          if (matchedWords.length >= Math.ceil(targetWords.length * 0.6)) {
            score = 1;
          }
        }

        if (score === 0) continue;

        if (targetPrice !== null) {
          var priceEl = card.querySelector('.product-price, .price, [class*="price"]');
          if (priceEl) {
            var priceText = (priceEl.textContent || '').replace(/[^\\d.,]/g, '');
            var cardPrice = parseFloat(priceText);
            if (!isNaN(cardPrice) && Math.abs(cardPrice - targetPrice) <= 1) {
              score += 1;
            }
          }
        }

        if (score > bestScore) {
          var link = card.tagName === 'A'
            ? card
            : card.querySelector('a[href*="/elanlar/"]');
          if (link && link.href) {
            best = link.href;
            bestScore = score;
          }
        }
      }

      return best;
    `, title, price);

    if (!listingUrl) {
      console.log('[tapaz] no matching listing found on user listings page');
      return null;
    }

    console.log(`[tapaz] matched listing on user page (navigating to verify): ${listingUrl}`);

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
        if (/\\/elanlarim|\\/(my-?ads)|\\/(cabinet\\/ads)/.test(href)) return links[i].href;
      }
      return null;
    `);

    if (foundLink) {
      await driver.get(foundLink);
      await waitForPageLoad(driver, timeoutMs);

      const hasContent = await driver.executeScript<boolean>(`
        return !!(
          document.querySelector('.products-i, .lot-listing, .ad-card, [class*="listing-item"], a[href*="/elanlar/"]') ||
          document.querySelector('.cabinet, .my-ads, [class*="user-ads"]')
        );
      `);

      if (hasContent) return true;
    }

    const candidateUrls = [
      `${BASE_URL}/elanlarim`,
      `${BASE_URL}/cabinet`,
      `${BASE_URL}/hesab/elanlar`,
      `${BASE_URL}/my/ads`,
    ];

    for (const url of candidateUrls) {
      try {
        await driver.get(url);
        await waitForPageLoad(driver, timeoutMs);

        const hasListings = await driver.executeScript<boolean>(`
          return !!(
            document.querySelector('.products-i, .lot-listing, .ad-card, [class*="listing-item"], a[href*="/elanlar/"]') ||
            document.querySelector('[class*="cabinet"], [class*="my-ads"], [class*="user-ads"]')
          );
        `);

        if (hasListings) return true;
      } catch {
        continue;
      }
    }

    console.log('[tapaz] could not navigate to user listings page');
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

    const resolvedUrl = pageData.canonicalUrl ?? pageData.ogUrl;
    const candidate = resolvedUrl ?? pageData.currentUrl;

    if (!/\/elanlar\/\d+/.test(candidate)) {
      return null;
    }

    if (/404|not found|tapılmadı|tapilmadi/i.test(pageData.title)) {
      return null;
    }

    const looksEmpty = await driver.executeScript<boolean>(`
      var t = (document.title || '').toLowerCase();
      var body = (document.body && document.body.innerText) || '';
      if (t.includes('404') || t.includes('not found') || t.includes('tapılmadı')) return true;
      if (body.length < 80 && !document.querySelector('.product, .lot, [class*="elan"], [itemtype*="Product"]')) return true;
      return false;
    `);

    return looksEmpty ? null : candidate;
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
      } catch {
        continue;
      }
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
    } catch {
      // Element not found or not clickable
    }

    return false;
  }
}
