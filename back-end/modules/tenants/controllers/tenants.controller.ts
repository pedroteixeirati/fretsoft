import express from 'express';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import {
  canCreatePlatformTenants,
  canEditTenantProfile,
  canViewPlatformTenants,
  canViewTenantProfile,
  createPlatformTenant,
  getTenantProfile,
  listPlatformTenants,
  updateTenantProfile,
} from '../services/tenants.service';

const router = express.Router();

router.get('/tenant-profile', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canViewTenantProfile(req.auth?.role), 'Sem permissao para visualizar o perfil da transportadora.')) {
      return;
    }

    const profile = await getTenantProfile(req.auth);
    if (!profile) {
      res.status(404).json({ error: 'Transportadora nao encontrada.' });
      return;
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.put('/tenant-profile', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canEditTenantProfile(req.auth?.role), 'Sem permissao para editar o perfil da transportadora.')) {
      return;
    }

    const updated = await updateTenantProfile(req.auth, req.body as Record<string, string>);
    if (!updated) {
      res.status(404).json({ error: 'Transportadora nao encontrada.' });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/platform/tenants', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canViewPlatformTenants(req.auth?.role), 'Sem permissao para visualizar transportadoras da plataforma.')) {
      return;
    }

    res.json(await listPlatformTenants());
  } catch (error) {
    next(error);
  }
});

router.post('/platform/tenants', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canCreatePlatformTenants(req.auth?.role), 'Sem permissao para criar transportadoras.')) {
      return;
    }

    const created = await createPlatformTenant(req.auth, req.body as Record<string, string>);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

export default router;
