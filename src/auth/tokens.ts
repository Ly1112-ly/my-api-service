import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { config } from '../config.js';

export function createAccessToken(user: { id: string; email: string; role: UserRole }) {
  return jwt.sign({ userId: user.id, email: user.email, role: user.role }, config.jwtSecret, { algorithm: 'HS256', expiresIn: '15m' });
}

export function createRefreshToken() { return randomBytes(64).toString('base64url'); }
export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }
