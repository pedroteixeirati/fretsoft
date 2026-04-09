export type AppErrorDetails = Record<string, unknown> | null;

type AppErrorOptions = {
  statusCode?: number;
  code?: string;
  field?: string | null;
  details?: AppErrorDetails;
};

function defaultCodeForStatus(statusCode: number) {
  switch (statusCode) {
    case 400:
    case 422:
      return 'validation_error';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    default:
      return 'internal_server_error';
  }
}

export class AppError extends Error {
  statusCode: number;
  code: string;
  field: string | null;
  details: AppErrorDetails;

  constructor(message: string, options: number | AppErrorOptions = 400) {
    super(message);
    this.name = 'AppError';

    const resolvedOptions = typeof options === 'number' ? { statusCode: options } : options;

    this.statusCode = resolvedOptions.statusCode ?? 400;
    this.code = resolvedOptions.code || defaultCodeForStatus(this.statusCode);
    this.field = resolvedOptions.field ?? null;
    this.details = resolvedOptions.details ?? null;
  }
}

export function validationError(message: string, code: string, field?: string, details?: AppErrorDetails) {
  return new AppError(message, { statusCode: 400, code, field: field || null, details: details ?? null });
}

export function unauthorizedError(message: string, code = 'unauthorized') {
  return new AppError(message, { statusCode: 401, code });
}

export function forbiddenError(message: string, code = 'forbidden') {
  return new AppError(message, { statusCode: 403, code });
}

export function notFoundError(message: string, code = 'not_found', details?: AppErrorDetails) {
  return new AppError(message, { statusCode: 404, code, details: details ?? null });
}

export function conflictError(message: string, code = 'conflict', field?: string, details?: AppErrorDetails) {
  return new AppError(message, { statusCode: 409, code, field: field || null, details: details ?? null });
}
