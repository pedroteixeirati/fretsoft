import type { Response } from 'express';
import { forbiddenError } from '../errors/app-error';
import { isFeatureEnabled, type FeatureMap } from '../authorization/features';
import { sendErrorResponse } from './error-response';

export function ensureFeature(res: Response, features: FeatureMap | undefined, key: string, message?: string) {
  if (!isFeatureEnabled(features, key)) {
    sendErrorResponse(
      res,
      forbiddenError(message || 'Modulo nao habilitado para este tenant.', 'feature_disabled'),
    );
    return false;
  }
  return true;
}
