import type { NextFunction, Response } from 'express';
import { forbiddenError, unauthorizedError } from '../../../shared/errors/app-error';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { adminAuth } from '../../../shared/infra/firebase/firebaseAdmin';
import type { AuthenticatedRequest } from '../dtos/auth-context';
import { resolveAuthContext } from '../services/auth-context.service';

export async function loadAuthContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      sendErrorResponse(res, unauthorizedError('Token de autenticacao ausente.', 'missing_auth_token'));
      return;
    }

    const decoded = await adminAuth.verifyIdToken(header.replace('Bearer ', ''));
    const authContext = await resolveAuthContext(decoded);

    if (!authContext) {
      sendErrorResponse(
        res,
        forbiddenError(
          'Usuario autenticado sem vinculacao a uma transportadora ativa. Solicite acesso ao administrador da plataforma.',
          'tenant_access_required'
        )
      );
      return;
    }

    req.auth = authContext;
    next();
  } catch (error) {
    next(error);
  }
}
