import type { NextFunction, Response } from 'express';
import { adminAuth } from '../../../shared/infra/firebase/firebaseAdmin';
import type { AuthenticatedRequest } from '../dtos/auth-context';
import { resolveAuthContext } from '../services/auth-context.service';

export async function loadAuthContext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autenticacao ausente.' });
      return;
    }

    const decoded = await adminAuth.verifyIdToken(header.replace('Bearer ', ''));
    const authContext = await resolveAuthContext(decoded);

    if (!authContext) {
      res.status(403).json({ error: 'Usuario autenticado sem vinculacao a uma transportadora ativa. Solicite acesso ao administrador da plataforma.' });
      return;
    }

    req.auth = authContext;
    next();
  } catch (error) {
    next(error);
  }
}
