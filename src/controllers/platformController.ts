import type { Request, Response } from 'express';
import { connectPlatform, getPlatforms } from '../services/platformService';

export async function getPlatformsController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(200).json(await getPlatforms(userId));
}

export async function connectPlatformController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  const platform = String(request.body?.platform ?? '');

  response.status(200).json(await connectPlatform(userId, platform));
}
