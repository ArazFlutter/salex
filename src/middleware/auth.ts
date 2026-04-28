import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const JWT_EXPIRES_IN = '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return 'dev-secret-change-in-production';
}

export interface AuthPayload {
  userId: string;
  phone: string;
}

export function signToken(payload: { userId: string; phone: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, getJwtSecret()) as AuthPayload;
}

function extractBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return undefined;
  }
  const value = authorization.slice(7).trim();
  return value || undefined;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.salex_token ?? extractBearerToken(req.headers.authorization);

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const payload = verifyToken(token);
    (req as any).authUser = payload;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
}
