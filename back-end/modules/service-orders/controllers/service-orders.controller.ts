import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  createServiceOrder,
  deleteServiceOrder,
  listServiceOrders,
  serviceOrderPermissions,
  updateServiceOrder,
} from '../services/service-orders.service';
import { serializeServiceOrder, serializeServiceOrders } from '../serializers/service-orders.serializer';

const router = express.Router();

router.get('/service-orders', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', serviceOrderPermissions, req.auth?.role), 'Sem permissao para visualizar ordens de servico.')) return;
    res.json(serializeServiceOrders(await listServiceOrders(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/service-orders', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', serviceOrderPermissions, req.auth?.role), 'Sem permissao para criar ordens de servico.')) return;
    res.status(201).json(serializeServiceOrder(await createServiceOrder(req.auth, req.body as Record<string, unknown>) || {}));
  } catch (error) {
    next(error);
  }
});

router.put('/service-orders/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', serviceOrderPermissions, req.auth?.role), 'Sem permissao para editar ordens de servico.')) return;
    const updated = await updateServiceOrder(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined || updated === null) {
      sendErrorResponse(res, notFoundError('Ordem de servico nao encontrada.', 'service_order_not_found'));
      return;
    }
    res.json(serializeServiceOrder(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/service-orders/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', serviceOrderPermissions, req.auth?.role), 'Sem permissao para excluir ordens de servico.')) return;
    const deleted = await deleteServiceOrder(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Ordem de servico nao encontrada.', 'service_order_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
