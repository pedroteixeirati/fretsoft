import express from 'express';
import { ensureAllowed } from '../../../shared/http/ensure-allowed';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { canCreateTenantUsers, createTenantUser } from '../services/users.service';
import type { CreateTenantUserInput } from '../dtos/user.types';

const router = express.Router();

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
