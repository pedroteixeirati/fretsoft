import express from 'express';
import { canPerform } from '../../../shared/authorization/permissions';
import { notFoundError } from '../../../shared/errors/app-error';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { sendErrorResponse } from '../../../shared/http/error-response';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import {
  createResource,
  getResourceConfig,
  listResources,
  removeResource,
  updateResource,
} from '../services/resources.service';

const router = express.Router();
const supportedResources = new Set<string>([]);

router.get('/:resourceName', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    const resource = getResourceConfig(req.params.resourceName);
    if (!resource || !supportedResources.has(req.params.resourceName)) {
      sendErrorResponse(res, notFoundError('Recurso nao encontrado.', 'resource_not_found'));
      return;
    }

    if (!ensureAllowed(res, canPerform('read', resource.permissions, req.auth?.role), 'Sem permissao para visualizar este recurso.')) {
      return;
    }

    res.json(await listResources(req.params.resourceName, req.auth));
  } catch (error) {
    next(error);
  }
});

router.post('/:resourceName', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    const resource = getResourceConfig(req.params.resourceName);
    if (!resource || !supportedResources.has(req.params.resourceName)) {
      sendErrorResponse(res, notFoundError('Recurso nao encontrado.', 'resource_not_found'));
      return;
    }

    if (!ensureAllowed(res, canPerform('create', resource.permissions, req.auth?.role), 'Sem permissao para criar neste recurso.')) {
      return;
    }

    const created = await createResource(req.params.resourceName, req.auth, req.body as Record<string, unknown>);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

router.put('/:resourceName/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    const resource = getResourceConfig(req.params.resourceName);
    if (!resource || !supportedResources.has(req.params.resourceName)) {
      sendErrorResponse(res, notFoundError('Recurso nao encontrado.', 'resource_not_found'));
      return;
    }

    if (!ensureAllowed(res, canPerform('update', resource.permissions, req.auth?.role), 'Sem permissao para editar este recurso.')) {
      return;
    }

    const updated = await updateResource(req.params.resourceName, req.auth, req.params.id, req.body as Record<string, unknown>);
    if (updated === undefined) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'resource_record_not_found'));
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:resourceName/:id', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    const resource = getResourceConfig(req.params.resourceName);
    if (!resource || !supportedResources.has(req.params.resourceName)) {
      sendErrorResponse(res, notFoundError('Recurso nao encontrado.', 'resource_not_found'));
      return;
    }

    if (!ensureAllowed(res, canPerform('delete', resource.permissions, req.auth?.role), 'Sem permissao para excluir este recurso.')) {
      return;
    }

    const deleted = await removeResource(req.params.resourceName, req.auth, req.params.id);
    if (!deleted) {
      sendErrorResponse(res, notFoundError('Registro nao encontrado.', 'resource_record_not_found'));
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
