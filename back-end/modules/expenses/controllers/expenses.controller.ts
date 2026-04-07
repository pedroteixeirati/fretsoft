import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { expensesResource } from '../expenses.resource';
import { serializeExpense, serializeExpenses } from '../serializers/expenses.serializer';
import {
  createResourceByConfig,
  listResourcesByConfig,
  removeResourceByConfig,
  updateResourceByConfig,
} from '../../resources/services/resources.service';

const router = express.Router();

router.get('/expenses', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', expensesResource.permissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
      return;
    }

    res.json(serializeExpenses(await listResourcesByConfig(expensesResource, req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/expenses', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', expensesResource.permissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
      return;
    }

    res.status(201).json(serializeExpense(await createResourceByConfig('expenses', expensesResource, req.auth, req.body as Record<string, unknown>) as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.put('/expenses/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', expensesResource.permissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
      return;
    }

    const updated = await updateResourceByConfig('expenses', expensesResource, req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined) {
      res.status(404).json({ error: 'Registro nao encontrado.' });
      return;
    }

    res.json(serializeExpense(updated as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.delete('/expenses/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', expensesResource.permissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
      return;
    }

    const deleted = await removeResourceByConfig('expenses', expensesResource, req.auth, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Registro nao encontrado.' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
