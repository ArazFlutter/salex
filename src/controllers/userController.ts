import type { Request, Response } from 'express';
import { getCurrentUser } from '../services/userService';

export async function getMeController(request: Request, response: Response) {
  const userId = (request as any).authUser.userId;
  response.status(200).json({
    success: true,
    user: await getCurrentUser(userId),
  });
}
