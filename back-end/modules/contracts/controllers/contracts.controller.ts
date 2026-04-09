import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { contractsResource } from '../contracts.resource';
import { serializeContract, serializeContracts } from '../serializers/contracts.serializer';
import {
  createResourceByConfig,
  listResourcesByConfig,
  removeResourceByConfig,
  updateResourceByConfig,
} from '../../resources/services/resources.service';

const router = express.Router();

router.get('/contracts', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('read', contractsResource.permissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
      return;
    }

    res.json(serializeContracts(await listResourcesByConfig(contractsResource, req.auth)));
  } catch (error) {
    next(error);
  }
});

router.post('/contracts', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('create', contractsResource.permissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
      return;
    }

    res.status(201).json(serializeContract(await createResourceByConfig('contracts', contractsResource, req.auth, req.body as Record<string, unknown>) as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.put('/contracts/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('update', contractsResource.permissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
      return;
    }

    const updated = await updateResourceByConfig('contracts', contractsResource, req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'contract_not_found'));
      return;
    }

    res.json(serializeContract(updated as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

router.delete('/contracts/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canPerform('delete', contractsResource.permissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
      return;
    }

    const deleted = await removeResourceByConfig('contracts', contractsResource, req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'contract_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
