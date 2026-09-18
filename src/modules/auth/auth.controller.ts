import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { csrfCookieOptions, csrfTokenCookie } from '../../auth/cookies.js';
import { loginUser, logoutSession, refreshSession, registerUser } from './auth.service.js';
import { accessTokenCookie, accessTokenCookieOptions, refreshTokenCookie, refreshTokenCookieOptions } from '../../auth/cookies.js';
import { HttpError } from '../../utils/http-error.js';

export function csrfController(_req: Request, res: Response) {
  const token = randomBytes(32).toString('hex');
  res.cookie(csrfTokenCookie, token, csrfCookieOptions);
  return res.json({ success: true, csrfToken: token });
}

export async function registerController(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      throw new HttpError(400, 'Name, email, and password are required');
    }

    const user = await registerUser({ name: String(name), email: String(email), password: String(password) });
    return res.status(201).json({ success: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    return next(error);
  }
}

export async function loginController(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required');
    }

    const result = await loginUser({ email: String(email), password: String(password) });
    res.cookie(accessTokenCookie, result.accessToken, accessTokenCookieOptions);
    res.cookie(refreshTokenCookie, result.refreshToken, refreshTokenCookieOptions);
    return res.json({ success: true, user: result.user, csrfRequired: true });
  } catch (error) {
    return next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const refreshToken = req.cookies?.[refreshTokenCookie];
    if (!refreshToken) {
      throw new HttpError(401, 'Refresh token is required');
    }

    const result = await refreshSession(refreshToken);
    res.cookie(accessTokenCookie, result.accessToken, accessTokenCookieOptions);
    res.cookie(refreshTokenCookie, result.refreshToken, refreshTokenCookieOptions);
    return res.json({ success: true, user: result.user });
  } catch (error) {
    return next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: (error?: unknown) => void) {
  try {
    const refreshToken = req.cookies?.[refreshTokenCookie];
    await logoutSession(refreshToken);
    res.clearCookie(accessTokenCookie, { path: '/' });
    res.clearCookie(refreshTokenCookie, { path: '/' });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
}

export async function meController(req: Request, res: Response) {
  return res.json({
    success: true,
    user: {
      userId: req.user?.userId,
      email: req.user?.email,
      role: req.user?.role
    }
  });
}
