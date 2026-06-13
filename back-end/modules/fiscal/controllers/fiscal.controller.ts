import express from 'express';
import type { NextFunction, Response } from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { ensureFeature } from '../../../shared/http/ensure-feature';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { fiscalPermissions } from '../fiscal.resource';
import type { FiscalDocumentInput } from '../dtos/fiscal-document.types';
import { serializeFiscalDocument, serializeFiscalDocuments } from '../serializers/fiscal-documents.serializer';
import { addMdfeDriverToDocument, buildFiscalDraftFromFreight, cancelFiscalDocument, closeMdfeDocument, createFiscalDocument, emitFiscalDocument, getFiscalDocument, handleFocusWebhook, listFiscalDocumentCommunicationLogs, listFiscalDocumentEvents, listTenantFiscalDocuments, removeFiscalDocument, resendFiscalDocument, sendFiscalCorrectionLetter, syncFiscalDocument, updateFiscalDocument } from '../services/fiscal-documents.service';
import { importNfeReceipt, listNfeReceipts, updateNfeReceiptStatus } from '../services/fiscal-nfe-receipts.service';
import { serializeNfeReceipt, serializeNfeReceipts } from '../serializers/fiscal-nfe-receipts.serializer';

const router = express.Router();

function requireFiscalFeature(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!ensureFeature(res, req.auth?.features, 'fiscal', 'Modulo fiscal nao habilitado para este tenant.')) {
    return;
  }
  next();
}

function validateFocusWebhookAuthorization(req: express.Request, res: Response) {
  const expected = (process.env.FOCUS_NFE_WEBHOOK_AUTHORIZATION || '').trim();
  const headerName = (process.env.FOCUS_NFE_WEBHOOK_AUTHORIZATION_HEADER || 'authorization').trim();
  if (!expected) {
    if (process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Webhook Focus NFe sem segredo configurado.', code: 'focus_webhook_secret_missing' });
      return false;
    }
    return true;
  }

  if (req.get(headerName) !== expected) {
    res.status(401).json({ error: 'Webhook Focus NFe nao autorizado.', code: 'focus_webhook_unauthorized' });
    return false;
  }
  return true;
}

router.post('/fiscal/webhooks/focus/:event?', async (req, res, next) => {
  try {
    if (!validateFocusWebhookAuthorization(req, res)) {
      return;
    }

    const result = await handleFocusWebhook(req.params.event, req.body);
    res.status(202).json({ ok: true, matched: result.matched });
  } catch (error) {
    next(error);
  }
});

router.get('/fiscal/documents', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', fiscalPermissions, req.auth?.role), 'Sem permissao para visualizar documentos fiscais.')) {
      return;
    }

    res.json(serializeFiscalDocuments(await listTenantFiscalDocuments(req.auth?.tenantId)));
  } catch (error) {
    next(error);
  }
});

router.get('/fiscal/documents/from-freight/:freightId', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', fiscalPermissions, req.auth?.role), 'Sem permissao para emitir documentos fiscais.')) {
      return;
    }

    const result = await buildFiscalDraftFromFreight(req.params.freightId, req.auth?.tenantId);
    if (!result) {
      sendErrorResponse(res, notFoundError('Frete nao encontrado.', 'freight_not_found'));
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/fiscal/nfe-receipts', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', fiscalPermissions, req.auth?.role), 'Sem permissao para visualizar NF-es recebidas.')) {
      return;
    }

    res.json(serializeNfeReceipts(await listNfeReceipts(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/nfe-receipts/import', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', fiscalPermissions, req.auth?.role), 'Sem permissao para importar NF-es.')) {
      return;
    }

    res.status(201).json(serializeNfeReceipt(await importNfeReceipt(req.auth, req.body as Record<string, unknown>) || {}));
  } catch (error) {
    next(error);
  }
});

router.patch('/fiscal/nfe-receipts/:id/status', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para atualizar NF-es recebidas.')) {
      return;
    }

    const receipt = await updateNfeReceiptStatus(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (!receipt) {
      sendErrorResponse(res, notFoundError('NF-e recebida nao encontrada.', 'nfe_receipt_not_found'));
      return;
    }

    res.json(serializeNfeReceipt(receipt));
  } catch (error) {
    next(error);
  }
});

router.get('/fiscal/documents/:id', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
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

router.get('/fiscal/documents/:id/logs', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', fiscalPermissions, req.auth?.role), 'Sem permissao para visualizar logs fiscais.')) {
      return;
    }

    const logs = await listFiscalDocumentCommunicationLogs(req.params.id, req.auth?.tenantId);
    if (!logs) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

router.get('/fiscal/documents/:id/events', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', fiscalPermissions, req.auth?.role), 'Sem permissao para visualizar eventos fiscais.')) {
      return;
    }

    const events = await listFiscalDocumentEvents(req.params.id, req.auth?.tenantId);
    if (!events) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(events);
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', fiscalPermissions, req.auth?.role), 'Sem permissao para criar documentos fiscais.')) {
      return;
    }

    res.status(201).json(serializeFiscalDocument(await createFiscalDocument(req.auth?.tenantId, req.auth?.userId, req.body as FiscalDocumentInput) || {}));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents/:id/emit', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
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

router.post('/fiscal/documents/:id/sync', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
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

router.post('/fiscal/documents/:id/email', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para reenviar documentos fiscais.')) {
      return;
    }

    const emails = Array.isArray((req.body as { emails?: unknown }).emails) ? ((req.body as { emails: string[] }).emails) : [];
    const document = await resendFiscalDocument(req.params.id, req.auth?.tenantId, emails);
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents/:id/close', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para encerrar documentos fiscais.')) {
      return;
    }

    const document = await closeMdfeDocument(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents/:id/cancel', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para cancelar documentos fiscais.')) {
      return;
    }

    const justification = typeof (req.body as { justification?: unknown }).justification === 'string'
      ? (req.body as { justification: string }).justification
      : '';
    const document = await cancelFiscalDocument(req.params.id, req.auth?.tenantId, req.auth?.userId, justification);
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents/:id/correction-letter', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para emitir carta de correcao.')) {
      return;
    }

    const body = req.body as {
      correctedField?: string;
      correctedValue?: string;
      correctedGroup?: string;
      correctedGroupItemNumber?: string;
    };
    const document = await sendFiscalCorrectionLetter(req.params.id, req.auth?.tenantId, req.auth?.userId, {
      correctedField: body.correctedField || '',
      correctedValue: body.correctedValue || '',
      correctedGroup: body.correctedGroup || '',
      correctedGroupItemNumber: body.correctedGroupItemNumber || '',
    });
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.post('/fiscal/documents/:id/mdfe-driver', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', fiscalPermissions, req.auth?.role), 'Sem permissao para incluir condutor no MDF-e.')) {
      return;
    }

    const body = req.body as { name?: string; cpf?: string };
    const document = await addMdfeDriverToDocument(req.params.id, req.auth?.tenantId, req.auth?.userId, {
      name: body.name || '',
      cpf: body.cpf || '',
    });
    if (!document) {
      sendErrorResponse(res, notFoundError('Documento fiscal nao encontrado.', 'fiscal_document_not_found'));
      return;
    }

    res.json(serializeFiscalDocument(document));
  } catch (error) {
    next(error);
  }
});

router.put('/fiscal/documents/:id', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
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

router.delete('/fiscal/documents/:id', loadAuthContext, requireFiscalFeature, async (req: AuthenticatedRequest, res, next) => {
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
