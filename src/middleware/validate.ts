import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { fail, Errors } from '../lib/response';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = (result.error as ZodError).errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }));
      return fail(res, Errors.validation('Request validation failed', issues));
    }
    req[source] = result.data;
    next();
  };
}
