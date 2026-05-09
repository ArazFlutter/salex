/**
 * Manages OTP codes for platform login flows.
 * Supports three modes:
 * 1. Static env var (for testing) - e.g., TAPAZ_OTP_CODE=1234
 * 2. In-memory code pool (for Railway) - user submits via API
 * 3. File-based polling (for local dev) - user writes to file
 */

import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger';

const OTP_POLL_INTERVAL_MS = 500;
const DEFAULT_OTP_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * In-memory store for OTP codes pending verification.
 * Maps "platformId:phone" → { code, expiresAt }
 */
const otpCodePool = new Map<string, { code: string; expiresAt: number }>();

function getPoolKey(platformId: string, phone: string): string {
  return `${platformId}:${phone}`;
}

/**
 * Submit an OTP code to the pool (user provides it via API).
 * Used for Railway testing when user receives SMS and submits code via UI.
 */
export function submitOtpCode(platformId: string, phone: string, code: string): void {
  const key = getPoolKey(platformId, phone);
  const expiresAt = Date.now() + DEFAULT_OTP_TIMEOUT_MS;
  otpCodePool.set(key, { code, expiresAt });
  log.info('platform_otp.code_submitted', { platformId, phone });
}

/**
 * Acquire OTP code for platform login.
 * Tries in order:
 * 1. Static env var (e.g., TAPAZ_OTP_CODE=1234)
 * 2. In-memory pool (user submitted via API)
 * 3. File-based polling (user writes to file)
 */
export async function acquireOtpCode(
  platformId: string,
  phone: string,
  envPrefix: string,
  timeoutMs: number = DEFAULT_OTP_TIMEOUT_MS,
): Promise<string | null> {
  // Try static env var first (highest priority for testing)
  const staticOtp = process.env[`${envPrefix}_OTP_CODE`]?.trim();
  if (staticOtp && /^\d{4,6}$/.test(staticOtp)) {
    log.info('platform_otp.static_code', { platformId, phone: masked(phone) });
    return staticOtp;
  }

  // Try in-memory pool (works on ephemeral filesystems like Railway)
  const poolKey = getPoolKey(platformId, phone);
  const pooledCode = otpCodePool.get(poolKey);
  if (pooledCode && pooledCode.expiresAt > Date.now()) {
    log.info('platform_otp.pool_code', { platformId, phone: masked(phone) });
    otpCodePool.delete(poolKey);
    return pooledCode.code;
  }

  // Fall back to file-based polling (local dev)
  return await pollOtpFromFile(platformId, phone, envPrefix, timeoutMs);
}

/**
 * Poll for OTP code from a file.
 * Used in local development where user manually writes code to file.
 */
async function pollOtpFromFile(
  platformId: string,
  phone: string,
  envPrefix: string,
  timeoutMs: number,
): Promise<string | null> {
  const otpFilePath = process.env[`${envPrefix}_OTP_FILE`]?.trim() || path.join(process.cwd(), `.${platformId}-otp`);
  const deadline = Date.now() + timeoutMs;

  // Write marker file
  try {
    fs.writeFileSync(otpFilePath, 'WAITING', 'utf-8');
  } catch (err) {
    log.warn('platform_otp.file_write_failed', { platformId, phone: masked(phone), path: otpFilePath });
    return null;
  }

  // Print instructions for user
  console.log('─'.repeat(70));
  console.log(`[${platformId}] OTP required for phone: ${phone}`);
  console.log(`[${platformId}] Option 1: Write OTP code to: ${otpFilePath}`);
  console.log(`[${platformId}] Option 2: POST to /api/platforms/${platformId}/otp with { phone, code }`);
  console.log(`[${platformId}] Timeout: ${Math.round((deadline - Date.now()) / 1000)}s`);
  console.log(`[${platformId}] Example file: echo 1234 > "${otpFilePath}"`);
  console.log('─'.repeat(70));

  // Poll file
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, OTP_POLL_INTERVAL_MS));

    try {
      const content = fs.readFileSync(otpFilePath, 'utf-8').trim();
      const match = content.match(/^(\d{4,6})$/);
      if (match) {
        log.info('platform_otp.file_code', { platformId, phone: masked(phone) });
        try { fs.unlinkSync(otpFilePath); } catch { /* ignore */ }
        return match[1];
      }
    } catch {
      // File may be deleted or inaccessible
    }
  }

  log.warn('platform_otp.timeout', { platformId, phone: masked(phone) });
  try { fs.unlinkSync(otpFilePath); } catch { /* ignore */ }
  return null;
}

/**
 * Clear expired codes from pool (can be called periodically).
 */
export function cleanupExpiredCodes(): number {
  const now = Date.now();
  let count = 0;
  for (const [key, data] of otpCodePool.entries()) {
    if (data.expiresAt <= now) {
      otpCodePool.delete(key);
      count++;
    }
  }
  return count;
}

function masked(phone: string): string {
  if (!phone) return '***';
  return phone.slice(0, 3) + '*'.repeat(phone.length - 3);
}
