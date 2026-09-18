import { Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../../config.js';
import { prisma } from '../../db/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import { createAccessToken, createRefreshToken, hashToken } from '../../auth/tokens.js';

const oneDay = 24 * 60 * 60 * 1000;
const thirtyDays = 30 * oneDay;
const fifteenMinutes = 15 * 60 * 1000;

export function sanitizeUser(user: { id: string; email: string; name: string; role: UserRole; status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'; emailVerifiedAt: Date | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt
  };
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email || !password || password.length < 8) {
    throw new HttpError(400, 'Name, email, and password with at least 8 characters are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: config.ownerEmails.includes(email) ? UserRole.ADMIN : UserRole.USER,
      emailVerifiedAt: new Date()
    }
  });

  return sanitizeUser(user);
}

export async function loginUser(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new HttpError(403, 'Account is not active');
  }

  const accessToken = createAccessToken({ id: user.id, email: user.email, role: user.role });
  const refreshToken = createRefreshToken();

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + thirtyDays)
    }
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user)
  };
}

export async function refreshSession(refreshToken: string) {
  const session = await prisma.session.findFirst({
    where: {
      refreshTokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: { user: true }
  });

  if (!session) {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  const nextRefreshToken = createRefreshToken();

  await prisma.$transaction([
    prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(nextRefreshToken),
        expiresAt: new Date(Date.now() + thirtyDays)
      }
    })
  ]);

  const accessToken = createAccessToken({ id: session.user.id, email: session.user.email, role: session.user.role });

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    user: sanitizeUser(session.user)
  };
}

export async function logoutSession(refreshToken?: string) {
  if (!refreshToken) {
    return;
  }

  await prisma.session.updateMany({
    where: {
      refreshTokenHash: hashToken(refreshToken)
    },
    data: {
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() - 1000)
    }
  });
}
