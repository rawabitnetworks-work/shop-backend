import { Response } from 'express';

export type ApiError = {
  code: string;
  message: string;
  status: number;
  details?: unknown;
};

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, ...data });
}

export function fail(res: Response, error: ApiError) {
  return res.status(error.status).json({ success: false, error });
}

// ── Common error factories ────────────────────────────────────────────────────

export const Errors = {
  notFound: (entity: string): ApiError => ({
    code: `${entity.toUpperCase().replace(/ /g, '_')}_NOT_FOUND`,
    message: `No ${entity} found with the provided identifier.`,
    status: 404,
  }),
  validation: (message: string, details?: unknown): ApiError => ({
    code: 'VALIDATION_ERROR',
    message,
    status: 400,
    details,
  }),
  unauthorized: (): ApiError => ({
    code: 'UNAUTHORIZED',
    message: 'Authentication required.',
    status: 401,
  }),
  forbidden: (): ApiError => ({
    code: 'FORBIDDEN',
    message: 'You do not have permission to perform this action.',
    status: 403,
  }),
  internal: (message = 'An unexpected error occurred.'): ApiError => ({
    code: 'INTERNAL_ERROR',
    message,
    status: 500,
  }),
  uploadFailed: (message: string): ApiError => ({
    code: 'UPLOAD_FAILED',
    message,
    status: 500,
  }),
};
