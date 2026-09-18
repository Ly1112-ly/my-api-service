import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { csrfCookieOptions, csrfTokenCookie } from '../../auth/cookies.js';

export function csrfController(_req: Request, res: Response) {
  const token = randomBytes(32).toString('hex');
  res.cookie(csrfTokenCookie, token, csrfCookieOptions);
  return res.json({ success: true, csrfToken: token });
}
