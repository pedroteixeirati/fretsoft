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
  createDriver,
  deleteDriver,
  driversPermissions,
  listDrivers,
  updateDriver,
} from '../services/drivers.service';

const router = express.Router();

function requirePassengerOps(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!ensureFeature(res, req.auth?.features, 'passenger_ops', 'Operacao de passageiros nao habilitada para este tenant.')) {
    return;
  }
  next();
}

router.get('/drivers', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', driversPermissions, req.auth?.role), 'Sem permissao para visualizar motoristas.')) return;
    res.json(await listDrivers(req.auth));
  } catch (error) {
    next(error);
  }
});

router.post('/drivers', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', driversPermissions, req.auth?.role), 'Sem permissao para criar motoristas.')) return;
    res.status(201).json(await createDriver(req.auth, req.body as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.put('/drivers/:id', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', driversPermissions, req.auth?.role), 'Sem permissao para editar motoristas.')) return;
    const updated = await updateDriver(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined || updated === null) {
      sendErrorResponse(res, notFoundError('Motorista nao encontrado.', 'driver_not_found'));
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/drivers/:id', loadAuthContext, requirePassengerOps, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', driversPermissions, req.auth?.role), 'Sem permissao para excluir motoristas.')) return;
    const deleted = await deleteDriver(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Motorista nao encontrado.', 'driver_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
