import type { Request, Response } from 'express';
import { clearGlobalAuthSession, sendOtp, verifyOtp } from '../services/otpService';

export async function sendOtpController(request: Request, response: Response) {
  const phone = String(request.body?.phone ?? '');
  const result = await sendOtp(phone);

  response.status(200).json(result);
}

export async function verifyOtpController(request: Request, response: Response) {
  const phone = String(request.body?.phone ?? '');
  const code = String(request.body?.code ?? '');
  const result = await verifyOtp(phone, code);

  response.cookie('salex_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  response.status(200).json({ success: true, user: result.user });
}

export async function logoutController(_request: Request, response: Response) {
  response.clearCookie('salex_token');
  response.status(200).json({ success: true });
}
