import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({ success: false, message: error.issues[0]?.message ?? 'Validation failed' });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this value already exists' });
  }

  console.error(error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}
