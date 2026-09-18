import type { CookieOptions } from 'express';
import { config } from '../config.js';

export const accessTokenCookie = 'access_token';
export const refreshTokenCookie = 'refresh_token';
export const csrfTokenCookie = 'csrf_token';

const base: CookieOptions = {
  secure: config.secureCookies,
  sameSite: 'lax',
  path: '/'
};

export const accessTokenCookieOptions: CookieOptions = { ...base, httpOnly: true, maxAge: 15 * 60 * 1000 };
export const refreshTokenCookieOptions: CookieOptions = { ...base, httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 };
export const csrfCookieOptions: CookieOptions = { ...base, httpOnly: true, maxAge: 15 * 60 * 1000 };
