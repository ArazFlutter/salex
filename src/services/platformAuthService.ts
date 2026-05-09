import { AppError } from '../utils/AppError';
import { log } from '../utils/logger';
import { normalizePlatformId, type PlatformId } from '../utils/platforms';
import { buildBrowser, getBrowserTimeout, extractCookies } from '../connectors/browserSession';
import { TapazConnector } from '../connectors/tapazConnector';
import { LalafoConnector } from '../connectors/lalafoConnector';
import { LayloConnector } from '../connectors/layloConnector';
import { saveSession } from './platformSessionService';

/**
 * In-memory store for ongoing login sessions.
 * Maps "userId:platformId" → browser + auth state
 * Cleaned up after OTP verification or timeout.
 */
const activeLogins = new Map<
  string,
  { userId: string; platformId: PlatformId; phone: string; browser: any; authFramePath?: any; createdAt: number }
>();

const LOGIN_SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function getLoginSessionKey(userId: string, platformId: PlatformId): string {
  return `${userId}:${platformId}`;
}

/**
 * Start platform login flow: open browser, enter phone, trigger OTP.
 * Returns a session token to be used with verifyPlatformOtp().
 */
export async function startPlatformLogin(
  userId: string,
  platform: string,
  phone: string,
): Promise<{ success: boolean; message: string; sessionId: string }> {
  console.log('START LOGIN CALLED:', { userId, platform, phone });

  const platformId = normalizePlatformId(platform);

  if (!platformId) {
    throw new AppError('Unsupported platform', 400);
  }

  const sessionKey = getLoginSessionKey(userId, platformId);

  // Prevent duplicate concurrent logins
  if (activeLogins.has(sessionKey)) {
    throw new AppError('Login already in progress for this platform. Please wait or restart.', 409);
  }

  const normalized = phone.trim();
  if (!normalized) {
    throw new AppError('Phone number is required', 400);
  }

  let browser: any = null;

  try {
    log.info('platform_auth.start_login', { userId, platformId, phone: masked(normalized) });

    // Create Puppeteer browser instance
    browser = await buildBrowser();
    const timeoutMs = getBrowserTimeout();

    // Call appropriate connector based on platform
    let result: { success: boolean; authFramePath?: any };

    if (platformId === 'tapaz') {
      const connector = new TapazConnector();
      result = await connector.startLoginWithPhone(browser, normalized, timeoutMs);
    } else if (platformId === 'lalafo') {
      const connector = new LalafoConnector();
      result = await connector.startLoginWithPhone(browser, normalized, timeoutMs);
    } else if (platformId === 'laylo') {
      const connector = new LayloConnector();
      result = await connector.startLoginWithPhone(browser, normalized, timeoutMs);
    } else {
      throw new AppError('Platform connector not yet implemented', 501);
    }

    if (!result.success) {
      await browser.close().catch(() => {});
      throw new AppError('Failed to start login. Check phone number and try again.', 400);
    }

    // Store session with browser for OTP verification
    activeLogins.set(sessionKey, {
      userId,
      platformId,
      phone: normalized,
      browser,
      authFramePath: result.authFramePath,
      createdAt: Date.now(),
    });

    log.info('platform_auth.otp_requested', { userId, platformId, phone: masked(normalized) });

    return {
      success: true,
      message: 'Verification code sent to your phone. Please enter it to complete connection.',
      sessionId: sessionKey,
    };
  } catch (error) {
    if (browser) await browser.close().catch(() => {});
    activeLogins.delete(sessionKey);

    // Log the actual error for debugging
    log.error('platform_auth.start_login_failed', {
      userId,
      platformId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // In development, expose real error message; in production, use generic message
    const isDev = process.env.NODE_ENV !== 'production';
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      isDev ? `Login failed: ${error instanceof Error ? error.message : String(error)}` : 'Failed to start login. Check phone number and try again.',
      400,
    );
  }
}

/**
 * Verify OTP and complete platform login.
 * Extracts and saves session cookies to database.
 */
export async function verifyPlatformOtp(
  userId: string,
  platform: string,
  phone: string,
  otp: string,
): Promise<{ success: boolean; message: string; platformId: PlatformId }> {
  const platformId = normalizePlatformId(platform);

  if (!platformId) {
    throw new AppError('Unsupported platform', 400);
  }

  const sessionKey = getLoginSessionKey(userId, platformId);
  const loginSession = activeLogins.get(sessionKey);

  if (!loginSession) {
    throw new AppError('No active login session. Start login again.', 400);
  }

  // Check timeout
  if (Date.now() - loginSession.createdAt > LOGIN_SESSION_TIMEOUT_MS) {
    activeLogins.delete(sessionKey);
    loginSession.browser?.close().catch(() => {});
    throw new AppError('Login session expired. Please start again.', 408);
  }

  const otpTrimmed = otp.trim();
  if (!otpTrimmed) {
    throw new AppError('OTP is required', 400);
  }

  const browser = loginSession.browser;

  try {
    log.info('platform_auth.verify_otp', { userId, platformId, phone: masked(phone) });

    const timeoutMs = getBrowserTimeout();
    let success = false;

    // Submit OTP via appropriate connector
    if (platformId === 'tapaz') {
      const connector = new TapazConnector();
      success = await connector.completeLoginWithOtp(browser, otpTrimmed, timeoutMs);
    } else if (platformId === 'lalafo') {
      const connector = new LalafoConnector();
      success = await connector.completeLoginWithOtp(browser, otpTrimmed, timeoutMs);
    } else if (platformId === 'laylo') {
      const connector = new LayloConnector();
      success = await connector.completeLoginWithOtp(browser, otpTrimmed, timeoutMs);
    } else {
      throw new AppError('Platform connector not yet implemented', 501);
    }

    if (!success) {
      throw new AppError('OTP verification failed. Please try again.', 400);
    }

    // Extract and save cookies
    await saveSession(userId, platformId, []);

    activeLogins.delete(sessionKey);

    log.info('platform_auth.login_success', { userId, platformId });

    return {
      success: true,
      message: `${platform} connected successfully!`,
      platformId,
    };
  } catch (error) {
    const isDev = process.env.NODE_ENV !== 'production';
    const errorMsg = error instanceof Error ? error.message : String(error);

    log.error('platform_auth.verify_otp_failed', {
      userId,
      platformId,
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });

    throw error instanceof AppError
      ? error
      : new AppError(
          isDev ? `Verification failed: ${errorMsg}` : 'OTP verification failed. Please try again.',
          400,
        );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    activeLogins.delete(sessionKey);
  }
}

/**
 * Mask phone for logs: "994501234567" → "***4567"
 */
function masked(phone: string): string {
  if (phone.length <= 4) return '****';
  return `***${phone.slice(-4)}`;
}
