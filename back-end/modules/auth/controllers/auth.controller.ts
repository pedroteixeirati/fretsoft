import express from 'express';
import { loadAuthContext } from '../middlewares/load-auth-context.middleware';
import type { AuthenticatedRequest } from '../dtos/auth-context';

const router = express.Router();

router.get('/me/profile', loadAuthContext, async (req: AuthenticatedRequest, res) => {
  const auth = req.auth!;

  res.json({
    uid: auth.uid,
    email: auth.email,
    role: auth.role,
    name: auth.name,
    tenantId: auth.tenantId,
    tenantName: auth.tenantName,
    tenantSlug: auth.tenantSlug,
    tenantLogoUrl: auth.tenantLogoUrl || '',
  });
});

export default router;
