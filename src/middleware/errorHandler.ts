import { Request, Response, NextFunction } from 'express';
import { fail, Errors } from '../lib/response';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error('[errorHandler]', err);
  return fail(res, Errors.internal(err instanceof Error ? err.message : undefined));
}
