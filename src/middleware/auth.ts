import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { accessTokenCookie } from '../auth/cookies.js';
import { config } from '../config.js';

type Claims = JwtPayload & { userId: string; email: string; role: UserRole };
function validClaims(value: string | JwtPayload): value is Claims {
  return typeof value !== 'string' && typeof value.userId === 'string' && typeof value.email === 'string' && Object.values(UserRole).includes(value.role);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const bearer = req.header('authorization')?.startsWith('Bearer ') ? req.header('authorization')!.slice(7).trim() : undefined;
  const token = req.cookies?.[accessTokenCookie] ?? bearer;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication is required' });
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (!validClaims(payload)) throw new Error('Invalid claims');
    req.user = { userId: payload.userId, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
