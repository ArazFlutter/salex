import type { Request, Response } from 'express';
import { query } from '../db/pool';
import { AppError } from '../utils/AppError';
import { clearGlobalAuthSession } from '../services/otpService';

export async function resetMySessionController(request: Request, response: Response) {
  if (process.env.NODE_ENV === 'production') {
    throw new AppError('Dev endpoints are disabled in production', 403);
  }

  // Clear all current OTP sessions
  await clearGlobalAuthSession();

  // Also clear the specific user's session if authenticated
  const userId = (request as any).authUser?.userId;
  if (userId) {
    await query(
      `UPDATE otp_sessions SET is_current = FALSE WHERE user_id = $1`,
      [userId],
    );
  }

  response.status(200).json({
    success: true,
    message: 'Session cleared. Please refresh the page and log in again.',
  });
}
