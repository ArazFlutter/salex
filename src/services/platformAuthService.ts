import { AppError } from '../utils/AppError';
import { log } from '../utils/logger';
import { normalizePlatformId, type PlatformId } from '../utils/platforms';
import { buildChromeDriver, getSeleniumTimeout, persistSessionCookies } from '../connectors/seleniumSession';
import { TapazConnector } from '../connectors/tapazConnector';
import { LalafoConnector } from '../connectors/lalafoConnector';
import { LayloConnector } from '../connectors/layloConnector';
import { saveSession } from './platformSessionService';

/**
 * In-memory store for ongoing login sessions.
 * Maps "userId:platformId" → driver + auth state
 * Cleaned up after OTP verification or timeout.
 */
const activeLogins = new Map<
  string,
  { userId: string; platformId: PlatformId; phone: string; driver: any; authFramePath?: any; createdAt: number }
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

  let driver: any = null;

  try {
    log.info('platform_auth.start_login', { userId, platformId, phone: masked(normalized) });

    // Create Selenium driver
    driver = await buildChromeDriver('TAPAZ');
    const timeoutMs = getSeleniumTimeout('TAPAZ');

    // Call appropriate connector based on platform
    let result: { success: boolean; authFramePath?: any };

    if (platformId === 'tapaz') {
      const connector = new TapazConnector();
      result = await connector.startLoginWithPhone(driver, normalized, timeoutMs);
    } else if (platformId === 'lalafo') {
      const connector = new LalafoConnector();
      result = await connector.startLoginWithPhone(driver, normalized, timeoutMs);
    } else if (platformId === 'laylo') {
      const connector = new LayloConnector();
      result = await connector.startLoginWithPhone(driver, normalized, timeoutMs);
    } else {
      throw new AppError('Platform connector not yet implemented', 501);
    }

    if (!result.success) {
      await driver.quit().catch(() => {});
      throw new AppError('Failed to start login. Check phone number and try again.', 400);
    }

    // Store session with driver for OTP verification
    activeLogins.set(sessionKey, {
      userId,
      platformId,
      phone: normalized,
      driver,
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
    if (driver) await driver.quit().catch(() => {});
    activeLogins.delete(sessionKey);
    throw error;
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
    loginSession.driver?.quit().catch(() => {});
    throw new AppError('Login session expired. Please start again.', 408);
  }

  const otpTrimmed = otp.trim();
  if (!otpTrimmed) {
    throw new AppError('OTP is required', 400);
  }

  const driver = loginSession.driver;

  try {
    log.info('platform_auth.verify_otp', { userId, platformId, phone: masked(phone) });

    const timeoutMs = getSeleniumTimeout('TAPAZ');
    let success = false;

    // Submit OTP via appropriate connector
    if (platformId === 'tapaz') {
      const connector = new TapazConnector();
      const authFramePath = loginSession.authFramePath;
      if (!authFramePath) {
        throw new AppError('Invalid session state: missing authFramePath', 500);
      }
      success = await connector.completeLoginWithOtp(driver, otpTrimmed, authFramePath, timeoutMs);
    } else if (platformId === 'lalafo') {
      const connector = new LalafoConnector();
      success = await connector.completeLoginWithOtp(driver, otpTrimmed, timeoutMs);
    } else if (platformId === 'laylo') {
      const connector = new LayloConnector();
      success = await connector.completeLoginWithOtp(driver, otpTrimmed, timeoutMs);
    } else {
      throw new AppError('Platform connector not yet implemented', 501);
    }

    if (!success) {
      throw new AppError('OTP verification failed. Please try again.', 400);
    }

    // Extract and save cookies
    await persistSessionCookies(driver, userId, platformId);
    await saveSession(userId, platformId, []);

    activeLogins.delete(sessionKey);

    log.info('platform_auth.login_success', { userId, platformId });

    return {
      success: true,
      message: `${platform} connected successfully!`,
      platformId,
    };
  } catch (error) {
    log.warn('platform_auth.verify_otp_failed', {
      userId,
      platformId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error instanceof AppError
      ? error
      : new AppError(
          error instanceof Error ? error.message : 'OTP verification failed',
          400,
        );
  } finally {
    if (driver) {
      await driver.quit().catch(() => {});
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
