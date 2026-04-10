import type { Request, Response } from 'express';
import { connectPlatform, getPlatforms } from '../services/platformService';

export async function getPlatformsController(_request: Request, response: Response) {
  response.status(200).json(await getPlatforms());
}

export async function connectPlatformController(request: Request, response: Response) {
  const platform = String(request.body?.platform ?? '');

  response.status(200).json(await connectPlatform(platform));
}
