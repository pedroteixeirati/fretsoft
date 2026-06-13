import express from 'express';
import type { NextFunction, Response } from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { ensureFeature } from '../../../shared/http/ensure-feature';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  createTransportLine,
  deleteTransportLine,
  listTransportLines,
  transportLinesPermissions,
  updateTransportLine,
} from '../services/transport-lines.service';

const router = express.Router();

function requirePassengerOps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!ensureFeature(res, req.auth?.features, 'passenger_ops', 'Operacao de passageiros nao habilitada para este tenant.')) {
    return;
  }
  next();
}

router.get('/transport-lines', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', transportLinesPermissions, req.auth?.role), 'Sem permissao para visualizar a escala.')) return;
    res.json(await listTransportLines(req.auth));
  } catch (error) {
    next(error);
  }
});

router.post('/transport-lines', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', transportLinesPermissions, req.auth?.role), 'Sem permissao para criar linhas.')) return;
    res.status(201).json(await createTransportLine(req.auth, req.body as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.put('/transport-lines/:id', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', transportLinesPermissions, req.auth?.role), 'Sem permissao para editar linhas.')) return;
    const updated = await updateTransportLine(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined || updated === null) {
      sendErrorResponse(res, notFoundError('Linha nao encontrada.', 'transport_line_not_found'));
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/transport-lines/:id', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', transportLinesPermissions, req.auth?.role), 'Sem permissao para excluir linhas.')) return;
    const deleted = await deleteTransportLine(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Linha nao encontrada.', 'transport_line_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
