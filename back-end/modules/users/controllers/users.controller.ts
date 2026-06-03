import express from 'express';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { canCreateTenantUsers, canListTenantUsers, createTenantUser, listUsersByTenant } from '../services/users.service';
import type { CreateTenantUserInput } from '../dtos/user.types';

const router = express.Router();

router.get('/users', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canListTenantUsers(req.auth?.role), 'Sem permissao para visualizar usuarios deste tenant.')) {
      return;
    }

    res.json(await listUsersByTenant(req.auth));
  } catch (error) {
    next(error);
  }
});

router.post('/users', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!ensureAllowed(res, canCreateTenantUsers(req.auth?.role), 'Sem permissao para gerenciar usuarios neste tenant.')) {
      return;
    }

    res.status(201).json(await createTenantUser(req.auth, req.body as CreateTenantUserInput));
  } catch (error) {
    next(error);
  }
});

export default router;
