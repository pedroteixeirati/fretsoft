import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  createVehicleDocument,
  deleteVehicleDocument,
  listVehicleDocuments,
  updateVehicleDocument,
  vehicleDocumentPermissions,
} from '../services/vehicle-documents.service';
import { serializeVehicleDocument, serializeVehicleDocuments } from '../serializers/vehicle-documents.serializer';

const router = express.Router();

router.get('/vehicle-documents', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', vehicleDocumentPermissions, req.auth?.role), 'Sem permissao para visualizar os documentos da frota.')) return;
    res.json(serializeVehicleDocuments(await listVehicleDocuments(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/vehicle-documents', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', vehicleDocumentPermissions, req.auth?.role), 'Sem permissao para criar documentos da frota.')) return;
    res.status(201).json(serializeVehicleDocument(await createVehicleDocument(req.auth, req.body as Record<string, unknown>) || {}));
  } catch (error) {
    next(error);
  }
});

router.put('/vehicle-documents/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', vehicleDocumentPermissions, req.auth?.role), 'Sem permissao para editar documentos da frota.')) return;
    const updated = await updateVehicleDocument(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined || updated === null) {
      sendErrorResponse(res, notFoundError('Documento da frota nao encontrado.', 'vehicle_document_not_found'));
      return;
    }
    res.json(serializeVehicleDocument(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/vehicle-documents/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', vehicleDocumentPermissions, req.auth?.role), 'Sem permissao para excluir documentos da frota.')) return;
    const deleted = await deleteVehicleDocument(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Documento da frota nao encontrado.', 'vehicle_document_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
