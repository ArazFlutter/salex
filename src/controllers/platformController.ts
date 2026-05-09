import type { Request, Response } from 'express';
import { connectPlatform, getPlatforms } from '../services/platformService';
import { startPlatformLogin, verifyPlatformOtp } from '../services/platformAuthService';

export async function getPlatformsController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(200).json(await getPlatforms(userId));
}

export async function connectPlatformController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  const platform = String(request.body?.platform ?? '');

  response.status(200).json(await connectPlatform(userId, platform));
}

export async function startPlatformLoginController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  const platform = String(request.params?.platform ?? '');
  const phone = String(request.body?.phone ?? '');

  const result = await startPlatformLogin(userId, platform, phone);
  response.status(200).json(result);
}

export async function verifyPlatformOtpController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  const platform = String(request.params?.platform ?? '');
  const phone = String(request.body?.phone ?? '');
  const otp = String(request.body?.otp ?? '');

  const result = await verifyPlatformOtp(userId, platform, phone, otp);
  response.status(200).json(result);
}
