import type { Response } from 'express';
import { AppError } from '../errors/app-error';

export type ApiErrorResponse = {
  error: string;
  code: string;
  field: string | null;
  details: Record<string, unknown> | null;
};

export function toErrorResponse(error: AppError): ApiErrorResponse {
  return {
    error: error.message,
    code: error.code,
    field: error.field,
    details: error.details,
  };
}

export function sendErrorResponse(res: Response, error: AppError) {
  return res.status(error.statusCode).json(toErrorResponse(error));
}
