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

  response.status(200).json(result);
}

export async function logoutController(_request: Request, response: Response) {
  await clearGlobalAuthSession();
  response.status(200).json({ success: true });
}
