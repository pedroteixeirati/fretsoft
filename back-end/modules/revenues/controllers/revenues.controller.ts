import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import {
  chargeRevenue,
  generateTenantRevenues,
  listRevenuePayments,
  listTenantRevenues,
  overdueRevenue,
  registerRevenuePayment,
  reverseRegisteredRevenuePayment,
  receiveRevenue,
} from '../services/revenues.service';

const router = express.Router();
const permissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial'],
  update: [],
  delete: [],
} as const;

router.get('/', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', permissions, req.auth?.role), 'Sem permissao para visualizar receitas.')) {
      return;
    }

    res.json(await listTenantRevenues(req.auth?.tenantId, req.auth?.userId));
  } catch (error) {
    next(error);
  }
});

router.post('/generate', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', permissions, req.auth?.role), 'Sem permissao para gerar receitas.')) {
      return;
    }

    res.json(await generateTenantRevenues(req.auth?.tenantId, req.auth?.userId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/charge', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', permissions, req.auth?.role), 'Sem permissao para gerar cobrancas.')) {
      return;
    }

    const revenue = await chargeRevenue(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!revenue) {
      sendErrorResponse(res, notFoundError('Receita nao encontrada.', 'revenue_not_found'));
      return;
    }

    res.json(revenue);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/payments', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', permissions, req.auth?.role), 'Sem permissao para visualizar pagamentos.')) {
      return;
    }

    res.json(await listRevenuePayments(req.params.id, req.auth?.tenantId));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/payments', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', permissions, req.auth?.role), 'Sem permissao para registrar recebimento.')) {
      return;
    }

    const revenue = await registerRevenuePayment(req.params.id, req.auth?.tenantId, req.body, req.auth?.userId);
    if (!revenue) {
      sendErrorResponse(res, notFoundError('Receita nao encontrada.', 'revenue_not_found'));
      return;
    }

    res.status(201).json(revenue);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/payments/:paymentId/reverse', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', permissions, req.auth?.role), 'Sem permissao para estornar recebimento.')) {
      return;
    }

    const revenue = await reverseRegisteredRevenuePayment(req.params.id, req.params.paymentId, req.auth?.tenantId, req.body, req.auth?.userId);
    if (!revenue) {
      sendErrorResponse(res, notFoundError('Receita ou pagamento nao encontrado.', 'revenue_payment_not_found'));
      return;
    }

    res.json(revenue);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/receive', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', permissions, req.auth?.role), 'Sem permissao para atualizar o recebimento.')) {
      return;
    }

    const revenue = await receiveRevenue(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!revenue) {
      sendErrorResponse(res, notFoundError('Receita nao encontrada.', 'revenue_not_found'));
      return;
    }

    res.json(revenue);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/overdue', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', permissions, req.auth?.role), 'Sem permissao para marcar atraso.')) {
      return;
    }

    const revenue = await overdueRevenue(req.params.id, req.auth?.tenantId, req.auth?.userId);
    if (!revenue) {
      sendErrorResponse(res, notFoundError('Receita nao encontrada.', 'revenue_not_found'));
      return;
    }

    res.json(revenue);
  } catch (error) {
    next(error);
  }
});

export default router;
