import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  createInspection,
  deleteInspection,
  listInspections,
  maintenanceInspectionPermissions,
  updateInspection,
} from '../services/maintenance-inspections.service';
import { serializeInspection, serializeInspections } from '../serializers/maintenance-inspections.serializer';

const router = express.Router();

router.get('/maintenance-inspections', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', maintenanceInspectionPermissions, req.auth?.role), 'Sem permissao para visualizar inspecoes preventivas.')) return;
    res.json(serializeInspections(await listInspections(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/maintenance-inspections', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', maintenanceInspectionPermissions, req.auth?.role), 'Sem permissao para criar inspecoes preventivas.')) return;
    res.status(201).json(serializeInspection(await createInspection(req.auth, req.body as Record<string, unknown>) || {}));
  } catch (error) {
    next(error);
  }
});

router.put('/maintenance-inspections/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', maintenanceInspectionPermissions, req.auth?.role), 'Sem permissao para editar inspecoes preventivas.')) return;
    const updated = await updateInspection(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined || updated === null) {
      sendErrorResponse(res, notFoundError('Inspecao preventiva nao encontrada.', 'maintenance_inspection_not_found'));
      return;
    }
    res.json(serializeInspection(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/maintenance-inspections/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', maintenanceInspectionPermissions, req.auth?.role), 'Sem permissao para excluir inspecoes preventivas.')) return;
    const deleted = await deleteInspection(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Inspecao preventiva nao encontrada.', 'maintenance_inspection_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
