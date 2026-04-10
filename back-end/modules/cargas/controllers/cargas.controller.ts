import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions.ts';
import { forbiddenError, notFoundError } from '../../../shared/errors/app-error.ts';
import { sendErrorResponse } from '../../../shared/http/error-response.ts';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware.ts';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context.ts';
import { serializeCargo, serializeCargos } from '../serializers/cargas.serializer.ts';
import {
  cargasPermissions,
  createCargo,
  deleteCargo,
  listCargos,
  listCargosByFreight,
  updateCargo,
} from '../services/cargas.service.ts';

const router = express.Router();

router.get('/cargas', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('read', cargasPermissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para visualizar cargas.'));
      return;
    }

    res.json(serializeCargos(await listCargos(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.get('/freights/:id/cargas', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('read', cargasPermissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para visualizar cargas.'));
      return;
    }

    res.json(serializeCargos(await listCargosByFreight(req.auth, req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.post('/cargas', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('create', cargasPermissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para criar cargas.'));
      return;
    }

    res.status(201).json(serializeCargo(await createCargo(req.auth, req.body)));
  } catch (error) {
    next(error);
  }
});

router.put('/cargas/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!canPerform('update', cargasPermissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para editar cargas.'));
      return;
    }

    const updated = await updateCargo(req.auth, req.params.id, req.body);
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
    if (!canPerform('delete', cargasPermissions, req.auth?.role)) {
      sendErrorResponse(res, forbiddenError('Sem permissao para excluir cargas.'));
      return;
    }

    const deleted = await deleteCargo(req.auth, req.params.id);
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
