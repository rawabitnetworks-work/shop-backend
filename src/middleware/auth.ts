import { Request, Response, NextFunction } from 'express';
import { fail, Errors } from '../lib/response';

export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'] as string;
  const expected = process.env.ADMIN_TOKEN;

  if (!token || token !== expected) {
    return fail(res, Errors.unauthorized());
  }
  next();
}