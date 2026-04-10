import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  updateVehicle,
  vehiclesPermissions,
} from '../services/vehicles.service';
import { serializeVehicle, serializeVehicles } from '../serializers/vehicles.serializer';

const router = express.Router();

router.get('/vehicles', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', vehiclesPermissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
      return;
    }

    res.json(serializeVehicles(await listVehicles(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/vehicles', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', vehiclesPermissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
      return;
    }

    res.status(201).json(serializeVehicle(await createVehicle(req.auth, req.body as Record<string, unknown>)));
  } catch (error) {
    next(error);
  }
});

router.put('/vehicles/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', vehiclesPermissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
      return;
    }

    const updated = await updateVehicle(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'vehicle_not_found'));
      return;
    }

    res.json(serializeVehicle(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/vehicles/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', vehiclesPermissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
      return;
    }

    const deleted = await deleteVehicle(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'vehicle_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
