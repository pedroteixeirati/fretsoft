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
  createNfseDocument,
  deleteNfseDocument,
  emitNfseDocument,
  listNfseDocuments,
  nfseDocumentPermissions,
  syncNfseDocument,
} from '../services/nfse-documents.service';

const router = express.Router();

function requireNfseFeature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!ensureFeature(res, req.auth?.features, 'fiscal.nfse', 'Emissao de NFS-e nao habilitada para este tenant.')) {
    return;
  }
  next();
}

router.get('/fiscal/nfse', loadAuthContext, requireNfseFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', nfseDocumentPermissions, req.auth?.role), 'Sem permissao para visualizar NFS-e.')) return;
    res.json(await listNfseDocuments(req.auth));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/nfse', loadAuthContext, requireNfseFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', nfseDocumentPermissions, req.auth?.role), 'Sem permissao para criar NFS-e.')) return;
    res.status(201).json(await createNfseDocument(req.auth, req.body as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/nfse/:id/emit', loadAuthContext, requireNfseFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', nfseDocumentPermissions, req.auth?.role), 'Sem permissao para emitir NFS-e.')) return;
    const result = await emitNfseDocument(req.auth, req.params.id);
    if (result.status === 'not_found') {
      sendErrorResponse(res, notFoundError('NFS-e nao encontrada.', 'nfse_not_found'));
      return;
    }
    res.json(result.document || {});
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/nfse/:id/sync', loadAuthContext, requireNfseFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', nfseDocumentPermissions, req.auth?.role), 'Sem permissao para sincronizar NFS-e.')) return;
    const result = await syncNfseDocument(req.auth, req.params.id);
    if (result.status === 'not_found') {
      sendErrorResponse(res, notFoundError('NFS-e nao encontrada.', 'nfse_not_found'));
      return;
    }
    res.json(result.document || {});
  } catch (error) {
    next(error);
  }
});

router.delete('/fiscal/nfse/:id', loadAuthContext, requireNfseFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', nfseDocumentPermissions, req.auth?.role), 'Sem permissao para excluir NFS-e.')) return;
    const deleted = await deleteNfseDocument(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Rascunho de NFS-e nao encontrado.', 'nfse_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
