import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export function requestId(_req: Request, res: Response, next: NextFunction) {
  const id = randomUUID();
  res.setHeader('x-request-id', id);
  res.locals.requestId = id;
  next();
}
