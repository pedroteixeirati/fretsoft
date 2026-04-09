import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { freightsResource } from '../freights.resource';
import { serializeFreight, serializeFreights } from '../serializers/freights.serializer';
import {
  createResourceByConfig,
  listResourcesByConfig,
  removeResourceByConfig,
  updateResourceByConfig,
} from '../../resources/services/resources.service';

const router = express.Router();

router.get('/freights', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', freightsResource.permissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
      return;
    }

    res.json(serializeFreights(await listResourcesByConfig(freightsResource, req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/freights', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', freightsResource.permissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
      return;
    }

    res.status(201).json(serializeFreight(await createResourceByConfig('freights', freightsResource, req.auth, req.body as Record<string, unknown>) as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.put('/freights/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', freightsResource.permissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
      return;
    }

    const updated = await updateResourceByConfig('freights', freightsResource, req.auth, req.params.id, req.body as Record<string, unknown>);
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
    if (!ensureAllowed(res, canPerform('delete', freightsResource.permissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
      return;
    }

    const deleted = await removeResourceByConfig('freights', freightsResource, req.auth, req.params.id);
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
