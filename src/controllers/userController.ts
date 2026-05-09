import type { Request, Response } from 'express';
import { getCurrentUser } from '../services/userService';

export async function getMeController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  
  // Prevent caching of user data to avoid stale data in Telegram Mini App
  response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('Expires', '0');
  
  response.status(200).json({
    success: true,
    user: await getCurrentUser(userId),
  });
}
