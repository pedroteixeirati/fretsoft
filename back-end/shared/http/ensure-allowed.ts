import type { Response } from 'express';
import { forbiddenError } from '../errors/app-error';
import { sendErrorResponse } from './error-response';

export function ensureAllowed(res: Response, allowed: boolean, message: string) {
  if (!allowed) {
    sendErrorResponse(res, forbiddenError(message));
    return false;
  }
  return true;
}
