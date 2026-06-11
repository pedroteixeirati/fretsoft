import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { fiscalPermissions } from '../fiscal.resource';
import type { FiscalDocumentInput } from '../dtos/fiscal-document.types';
import { serializeFiscalDocument, serializeFiscalDocuments } from '../serializers/fiscal-documents.serializer';
import { createFiscalDocument, emitFiscalDocument, getFiscalDocument, listTenantFiscalDocuments, removeFiscalDocument, syncFiscalDocument, updateFiscalDocument } from '../services/fiscal-documents.service';

const router = express.Router();

router.get('/fiscal/documents', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', fiscalPermissions, req.auth?.role), 'Sem permissao para visualizar documentos fiscais.')) {
      return;
    }

    res.json(serializeFiscalDocuments(await listTenantFiscalDocuments(req.auth?.tenantId)));
  } catch (error) {
    next(error);
  }
});

router.get('/fiscal/documents/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', fiscalPermissions, req.auth?.role), 'Sem permissao para visualizar documentos fiscais.')) {
      return;
    }

    const document = await getFiscalDocument(req.params.id, req.auth?.tenantId);
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', fiscalPermissions, req.auth?.role), 'Sem permissao para criar documentos fiscais.')) {
      return;
    }

    res.status(201).json(serializeFiscalDocument(await createFiscalDocument(req.auth?.tenantId, req.auth?.userId, req.body as FiscalDocumentInput) || {}));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents/:id/emit', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para emitir documentos fiscais.')) {
      return;
    }

    const document = await emitFiscalDocument(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents/:id/sync', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para sincronizar documentos fiscais.')) {
      return;
    }

    const document = await syncFiscalDocument(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.put('/fiscal/documents/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para editar documentos fiscais.')) {
      return;
    }

    const document = await updateFiscalDocument(req.params.id, req.auth?.tenantId, req.auth?.userId, req.body as FiscalDocumentInput);
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.delete('/fiscal/documents/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', fiscalPermissions, req.auth?.role), 'Sem permissao para excluir documentos fiscais.')) {
      return;
    }

    const deleted = await removeFiscalDocument(req.params.id, req.auth?.tenantId);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado ou nao pode ser excluido neste status.', 'fiscal_document_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
