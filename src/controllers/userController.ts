import type { Request, Response } from 'express';
import { getCurrentUser } from '../services/userService';

export async function getMeController(_request: Request, response: Response) {
  response.status(200).json({
    success: true,
    user: await getCurrentUser(),
  });
}
