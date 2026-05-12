import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import { serializeNovalogEntries, serializeNovalogEntry } from '../serializers/novalog.serializer';
import {
  createNovalogBatch,
  createNovalogEntry,
  deleteNovalogEntry,
  listNovalogEntries,
  listNovalogReferenceMonths,
  novalogPermissions,
  updateNovalogEntry,
} from '../services/novalog.service';
import {
  changeNovalogBillingItemStatus,
  closeNovalogBilling,
  createNovalogBilling,
  deleteNovalogBillingItem,
  getNovalogBilling,
  listNovalogBillings,
  listNovalogReportPayments,
  novalogBillingPermissions,
  updateNovalogBilling,
  updateNovalogBillingItem,
} from '../services/novalog-billings.service';

const router = express.Router();

router.get('/novalog/billings', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', novalogBillingPermissions, req.auth?.role), 'Sem permissao para visualizar faturamentos Novalog.')) {
      return;
    }

    res.json(await listNovalogBillings(req.auth));
  } catch (error) {
    next(error);
  }
});

router.get('/novalog/reports/payments', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', novalogBillingPermissions, req.auth?.role), 'Sem permissao para visualizar relatorios Novalog.')) {
      return;
    }

    res.json(await listNovalogReportPayments(req.auth));
  } catch (error) {
    next(error);
  }
});

router.get('/novalog/billings/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', novalogBillingPermissions, req.auth?.role), 'Sem permissao para visualizar faturamentos Novalog.')) {
      return;
    }

    const billing = await getNovalogBilling(req.auth, req.params.id);
    if (!billing) {
      sendErrorResponse(res, notFoundError('Faturamento nao encontrado.', 'novalog_billing_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.post('/novalog/billings', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', novalogBillingPermissions, req.auth?.role), 'Sem permissao para criar faturamentos Novalog.')) {
      return;
    }

    res.status(201).json(await createNovalogBilling(req.auth, req.body as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.put('/novalog/billings/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogBillingPermissions, req.auth?.role), 'Sem permissao para editar faturamentos Novalog.')) {
      return;
    }

    const billing = await updateNovalogBilling(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (!billing) {
      sendErrorResponse(res, notFoundError('Faturamento nao encontrado.', 'novalog_billing_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.post('/novalog/billings/:id/close', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogBillingPermissions, req.auth?.role), 'Sem permissao para fechar faturamentos Novalog.')) {
      return;
    }

    const billing = await closeNovalogBilling(req.auth, req.params.id);
    if (!billing) {
      sendErrorResponse(res, notFoundError('Faturamento nao encontrado.', 'novalog_billing_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.post('/novalog/billing-items/:id/receive', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogBillingPermissions, req.auth?.role), 'Sem permissao para baixar CT-es Novalog.')) {
      return;
    }

    const billing = await changeNovalogBillingItemStatus(req.auth, req.params.id, 'received');
    if (!billing) {
      sendErrorResponse(res, notFoundError('CT-e nao encontrado.', 'novalog_billing_item_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.put('/novalog/billing-items/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogBillingPermissions, req.auth?.role), 'Sem permissao para editar CT-es Novalog.')) {
      return;
    }

    const billing = await updateNovalogBillingItem(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (!billing) {
      sendErrorResponse(res, notFoundError('CT-e nao encontrado.', 'novalog_billing_item_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.delete('/novalog/billing-items/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogBillingPermissions, req.auth?.role), 'Sem permissao para excluir CT-es Novalog.')) {
      return;
    }

    const billing = await deleteNovalogBillingItem(req.auth, req.params.id);
    if (!billing) {
      sendErrorResponse(res, notFoundError('CT-e nao encontrado.', 'novalog_billing_item_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.post('/novalog/billing-items/:id/overdue', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogBillingPermissions, req.auth?.role), 'Sem permissao para marcar CT-es em atraso.')) {
      return;
    }

    const billing = await changeNovalogBillingItemStatus(req.auth, req.params.id, 'overdue');
    if (!billing) {
      sendErrorResponse(res, notFoundError('CT-e nao encontrado.', 'novalog_billing_item_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.post('/novalog/billing-items/:id/cancel', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogBillingPermissions, req.auth?.role), 'Sem permissao para cancelar CT-es.')) {
      return;
    }

    const billing = await changeNovalogBillingItemStatus(req.auth, req.params.id, 'canceled');
    if (!billing) {
      sendErrorResponse(res, notFoundError('CT-e nao encontrado.', 'novalog_billing_item_not_found'));
      return;
    }

    res.json(billing);
  } catch (error) {
    next(error);
  }
});

router.get('/novalog/entries', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', novalogPermissions, req.auth?.role), 'Sem permissao para visualizar lancamentos Novalog.')) {
      return;
    }

    res.json(serializeNovalogEntries(await listNovalogEntries(req.auth, {
      referenceMonth: typeof req.query.referenceMonth === 'string' ? req.query.referenceMonth : undefined,
    })));
  } catch (error) {
    next(error);
  }
});

router.get('/novalog/entries/reference-months', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', novalogPermissions, req.auth?.role), 'Sem permissao para visualizar competencias Novalog.')) {
      return;
    }

    res.json(await listNovalogReferenceMonths(req.auth));
  } catch (error) {
    next(error);
  }
});

router.post('/novalog/entries', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', novalogPermissions, req.auth?.role), 'Sem permissao para criar lancamentos Novalog.')) {
      return;
    }

    res.status(201).json(serializeNovalogEntry(await createNovalogEntry(req.auth, req.body as Record<string, unknown>)));
  } catch (error) {
    next(error);
  }
});

router.post('/novalog/entries/batch', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', novalogPermissions, req.auth?.role), 'Sem permissao para criar lotes Novalog.')) {
      return;
    }

    res.status(201).json(serializeNovalogEntries(await createNovalogBatch(req.auth, req.body as Record<string, unknown>)));
  } catch (error) {
    next(error);
  }
});

router.put('/novalog/entries/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', novalogPermissions, req.auth?.role), 'Sem permissao para editar lancamentos Novalog.')) {
      return;
    }

    const updated = await updateNovalogEntry(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'novalog_entry_not_found'));
      return;
    }

    res.json(serializeNovalogEntry(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/novalog/entries/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', novalogPermissions, req.auth?.role), 'Sem permissao para excluir lancamentos Novalog.')) {
      return;
    }

    const deleted = await deleteNovalogEntry(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'novalog_entry_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
