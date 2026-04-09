import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { payablesPermissions } from '../payables.resource';
import { serializePayable, serializePayables } from '../serializers/payables.serializer';
import {
  createPayable,
  listTenantPayables,
  overduePayable,
  payPayable,
  removePayable,
  updatePayable,
} from '../services/payables.service';
import type { PayableInput } from '../dtos/payable.types';

const router = express.Router();

router.get('/payables', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', payablesPermissions, req.auth?.role), 'Sem permissao para visualizar contas a pagar.')) {
      return;
    }

    res.json(serializePayables(await listTenantPayables(req.auth?.tenantId)));
  } catch (error) {
    next(error);
  }
});

router.post('/payables', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', payablesPermissions, req.auth?.role), 'Sem permissao para criar contas a pagar.')) {
      return;
    }

    res.status(201).json(serializePayable(await createPayable(req.auth?.tenantId, req.auth?.userId, req.body as PayableInput)));
  } catch (error) {
    next(error);
  }
});

router.put('/payables/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', payablesPermissions, req.auth?.role), 'Sem permissao para editar contas a pagar.')) {
      return;
    }

    const updated = await updatePayable(req.params.id, req.auth?.tenantId, req.auth?.userId, req.body as PayableInput);
    if (!updated) {
      sendErrorResponse(res, notFoundError('Conta a pagar nao encontrada.', 'payable_not_found'));
      return;
    }

    res.json(serializePayable(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/payables/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', payablesPermissions, req.auth?.role), 'Sem permissao para excluir contas a pagar.')) {
      return;
    }

    const deleted = await removePayable(req.params.id, req.auth?.tenantId);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Conta a pagar nao encontrada.', 'payable_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/payables/:id/pay', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', payablesPermissions, req.auth?.role), 'Sem permissao para registrar pagamento.')) {
      return;
    }

    const payable = await payPayable(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!payable) {
      sendErrorResponse(res, notFoundError('Conta a pagar nao encontrada.', 'payable_not_found'));
      return;
    }

    res.json(serializePayable(payable));
  } catch (error) {
    next(error);
  }
});

router.post('/payables/:id/overdue', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', payablesPermissions, req.auth?.role), 'Sem permissao para marcar atraso.')) {
      return;
    }

    const payable = await overduePayable(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!payable) {
      sendErrorResponse(res, notFoundError('Conta a pagar nao encontrada.', 'payable_not_found'));
      return;
    }

    res.json(serializePayable(payable));
  } catch (error) {
    next(error);
  }
});

export default router;
