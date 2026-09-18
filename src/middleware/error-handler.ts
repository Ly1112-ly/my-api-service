import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  }
  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
