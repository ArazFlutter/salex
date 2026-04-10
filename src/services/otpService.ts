import { AppError } from '../utils/AppError';
import { log } from '../utils/logger';
import { query, withTransaction } from '../db/pool';
import { getOrCreateUser } from './userService';

type OtpSessionRow = {
  id: number;
  phone: string;
  code: string;
  expires_at: Date;
  attempts: number;
};

const OTP_TTL_MS = 2 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function normalizePhone(phone: string): string {
  return phone.trim();
}

function generateOtpCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function sendOtp(phone: string) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    throw new AppError('Phone is required', 400);
  }

  const code = generateOtpCode();
  const expiresAt = Date.now() + OTP_TTL_MS;

  await query(
    `INSERT INTO otp_sessions (phone, code, expires_at, attempts, is_current)
     VALUES ($1, $2, $3, 0, FALSE)`,
    [normalizedPhone, code, new Date(expiresAt)],
  );

  log.info('auth.otp.sent', { phone: normalizedPhone, code });

  return {
    success: true,
    phone: normalizedPhone,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export async function verifyOtp(phone: string, code: string) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedCode = code.trim();

  if (!normalizedPhone || !normalizedCode) {
    throw new AppError('Phone and code are required', 400);
  }

  const result = await query<OtpSessionRow>(
    `SELECT id, phone, code, expires_at, attempts
     FROM otp_sessions
     WHERE phone = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    [normalizedPhone],
  );

  const record = result.rows[0];

  if (!record) {
    throw new AppError('OTP not found for this phone', 404);
  }

  if (Date.now() > new Date(record.expires_at).getTime()) {
    throw new AppError('OTP has expired', 400);
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    throw new AppError('Maximum verification attempts exceeded', 429);
  }

  if (record.code !== normalizedCode) {
    const nextAttempts = record.attempts + 1;

    await query(
      `UPDATE otp_sessions
       SET attempts = $1
       WHERE id = $2`,
      [nextAttempts, record.id],
    );

    if (nextAttempts >= MAX_ATTEMPTS) {
      throw new AppError('Maximum verification attempts exceeded', 429);
    }

    throw new AppError(`Invalid OTP code. ${MAX_ATTEMPTS - nextAttempts} attempt(s) remaining`, 400);
  }

  const user = await getOrCreateUser(normalizedPhone);

  await withTransaction(async (client) => {
    await client.query(`UPDATE otp_sessions SET is_current = FALSE WHERE is_current = TRUE`);
    await client.query(
      `UPDATE otp_sessions
       SET user_id = $1,
           verified_at = NOW(),
           is_current = TRUE
       WHERE id = $2`,
      [user.id, record.id],
    );
  });

  return {
    success: true,
    user,
  };
}

/** Clears the global "current" OTP session so GET /me returns 401 until someone verifies again. */
export async function clearGlobalAuthSession(): Promise<void> {
  await query(`UPDATE otp_sessions SET is_current = FALSE WHERE is_current = TRUE`);
}
