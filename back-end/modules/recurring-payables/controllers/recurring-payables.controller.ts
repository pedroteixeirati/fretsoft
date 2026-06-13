import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  createRecurringPayable,
  deleteRecurringPayable,
  generateRecurringPayablesForTenant,
  listRecurringPayables,
  recurringPayablePermissions,
  updateRecurringPayable,
} from '../services/recurring-payables.service';
import { serializeRecurringPayable, serializeRecurringPayables } from '../serializers/recurring-payables.serializer';

const router = express.Router();

router.get('/recurring-payables', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', recurringPayablePermissions, req.auth?.role), 'Sem permissao para visualizar despesas recorrentes.')) return;
    res.json(serializeRecurringPayables(await listRecurringPayables(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/recurring-payables', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', recurringPayablePermissions, req.auth?.role), 'Sem permissao para criar despesas recorrentes.')) return;
    res.status(201).json(serializeRecurringPayable(await createRecurringPayable(req.auth, req.body as Record<string, unknown>) || {}));
  } catch (error) {
    next(error);
  }
});

router.post('/recurring-payables/generate', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', recurringPayablePermissions, req.auth?.role), 'Sem permissao para gerar lancamentos de despesas recorrentes.')) return;
    const created = await generateRecurringPayablesForTenant(req.auth);
    res.json({ created });
  } catch (error) {
    next(error);
  }
});

router.put('/recurring-payables/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', recurringPayablePermissions, req.auth?.role), 'Sem permissao para editar despesas recorrentes.')) return;
    const updated = await updateRecurringPayable(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined || updated === null) {
      sendErrorResponse(res, notFoundError('Despesa recorrente nao encontrada.', 'recurring_payable_not_found'));
      return;
    }
    res.json(serializeRecurringPayable(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/recurring-payables/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', recurringPayablePermissions, req.auth?.role), 'Sem permissao para excluir despesas recorrentes.')) return;
    const deleted = await deleteRecurringPayable(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Despesa recorrente nao encontrada.', 'recurring_payable_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
