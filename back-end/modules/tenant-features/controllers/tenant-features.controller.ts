import express from 'express';
import { loadAuthContext } from '../../auth/middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../../auth/dtos/auth-context';
import { listTenantFeatures, setTenantFeature } from '../services/tenant-features.service';

const router = express.Router();

router.get('/tenant-features', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    res.json(await listTenantFeatures(req.auth));
  } catch (error) {
    next(error);
  }
});

router.put('/tenant-features/:key', loadAuthContext, async (req: AuthenticatedRequest, res, next) => {
  try {
    const enabled = (req.body as { enabled?: unknown }).enabled === true;
    res.json(await setTenantFeature(req.auth, req.params.key, enabled));
  } catch (error) {
    next(error);
  }
});

export default router;
