import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { serializeFreight, serializeFreights } from '../serializers/freights.serializer';
import {
  createFreight,
  deleteFreight,
  freightsPermissions,
  listFreights,
  updateFreight,
} from '../services/freights.service';

const router = express.Router();

router.get('/freights', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', freightsPermissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
      return;
    }

    res.json(serializeFreights(await listFreights(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/freights', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', freightsPermissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
      return;
    }

    res.status(201).json(serializeFreight(await createFreight(req.auth, req.body)));
  } catch (error) {
    next(error);
  }
});

router.put('/freights/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', freightsPermissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
      return;
    }

    const updated = await updateFreight(req.auth, req.params.id, req.body);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'freight_not_found'));
      return;
    }

    res.json(serializeFreight(updated as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.delete('/freights/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', freightsPermissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
      return;
    }

    const deleted = await deleteFreight(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'freight_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
