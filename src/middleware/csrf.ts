import type { NextFunction, Request, Response } from 'express';
import { csrfTokenCookie } from '../auth/cookies.js';

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookie = req.cookies?.[csrfTokenCookie];
  const header = req.header('x-csrf-token');
  if (!cookie || !header || cookie !== header) return res.status(403).json({ success: false, message: 'Invalid CSRF token' });
  return next();
}
