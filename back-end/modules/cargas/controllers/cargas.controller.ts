import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions.ts';
import { forbiddenError, notFoundError } from '../../../shared/errors/app-error.ts';
import { sendErrorResponse } from '../../../shared/http/error-response.ts';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware.ts';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context.ts';
import { cargasResource } from '../cargas.resource.ts';
import { serializeCargo, serializeCargos } from '../serializers/cargas.serializer.ts';
import {
  createResourceByConfig,
  listResourcesByConfig,
  mapResourceRow,
  removeResourceByConfig,
  updateResourceByConfig,
} from '../../resources/services/resources.service.ts';
import { listTenantCargosByFreight } from '../repositories/cargas.repository.ts';

const router = express.Router();

router.get('/cargas', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('read', cargasResource.permissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para visualizar cargas.'));
      return;
    }

    res.json(serializeCargos(await listResourcesByConfig(cargasResource, req.auth)));
  } catch (error) {
    next(error);
  }
});

router.get('/freights/:id/cargas', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('read', cargasResource.permissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para visualizar cargas.'));
      return;
    }

    const rows = await listTenantCargosByFreight(req.params.id, req.auth?.tenantId || '');
    res.json(serializeCargos(rows.map((row) => mapResourceRow(row, cargasResource))));
  } catch (error) {
    next(error);
  }
});

router.post('/cargas', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('create', cargasResource.permissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para criar cargas.'));
      return;
    }

    res.status(201).json(
      serializeCargo(
        await createResourceByConfig('cargas', cargasResource, req.auth, req.body as Record<string, unknown>) as Record<string, unknown>,
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.put('/cargas/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('update', cargasResource.permissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para editar cargas.'));
      return;
    }

    const updated = await updateResourceByConfig('cargas', cargasResource, req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Carga nao encontrada.', 'cargo_not_found'));
      return;
    }

    res.json(serializeCargo(updated as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.delete('/cargas/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('delete', cargasResource.permissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para excluir cargas.'));
      return;
    }

    const deleted = await removeResourceByConfig('cargas', cargasResource, req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Carga nao encontrada.', 'cargo_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
