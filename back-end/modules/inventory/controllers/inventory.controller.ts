import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import {
  createInventoryItem,
  createInventoryMovement,
  deleteInventoryItem,
  getInventoryItemMovements,
  inventoryPermissions,
  listInventoryItems,
  updateInventoryItem,
} from '../services/inventory.service';
import {
  serializeInventoryItem,
  serializeInventoryItems,
  serializeInventoryMovements,
} from '../serializers/inventory.serializer';

const router = express.Router();

router.get('/inventory-items', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', inventoryPermissions, req.auth?.role), 'Sem permissao para visualizar o almoxarifado.')) return;
    res.json(serializeInventoryItems(await listInventoryItems(req.auth)));
  } catch (error) {
    next(error);
  }
});

router.get('/inventory-items/:id/movements', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', inventoryPermissions, req.auth?.role), 'Sem permissao para visualizar movimentacoes do almoxarifado.')) return;
    const movements = await getInventoryItemMovements(req.auth, req.params.id);
    if (movements === null) {
      sendErrorResponse(res, notFoundError('Peca nao encontrada.', 'inventory_item_not_found'));
      return;
    }
    res.json(serializeInventoryMovements(movements));
  } catch (error) {
    next(error);
  }
});

router.post('/inventory-items', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', inventoryPermissions, req.auth?.role), 'Sem permissao para criar pecas no almoxarifado.')) return;
    res.status(201).json(serializeInventoryItem(await createInventoryItem(req.auth, req.body as Record<string, unknown>) || {}));
  } catch (error) {
    next(error);
  }
});

router.post('/inventory-movements', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', inventoryPermissions, req.auth?.role), 'Sem permissao para movimentar o almoxarifado.')) return;
    const result = await createInventoryMovement(req.auth, req.body as Record<string, unknown>);
    if (result.status === 'not_found') {
      sendErrorResponse(res, notFoundError('Peca nao encontrada.', 'inventory_item_not_found'));
      return;
    }
    res.status(201).json(serializeInventoryItem(result.item || {}));
  } catch (error) {
    next(error);
  }
});

router.put('/inventory-items/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', inventoryPermissions, req.auth?.role), 'Sem permissao para editar pecas do almoxarifado.')) return;
    const updated = await updateInventoryItem(req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined || updated === null) {
      sendErrorResponse(res, notFoundError('Peca nao encontrada.', 'inventory_item_not_found'));
      return;
    }
    res.json(serializeInventoryItem(updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/inventory-items/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', inventoryPermissions, req.auth?.role), 'Sem permissao para excluir pecas do almoxarifado.')) return;
    const deleted = await deleteInventoryItem(req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Peca nao encontrada.', 'inventory_item_not_found'));
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
