import type express from 'express';
import type { AppRole } from '../../../shared/authorization/permissions';

export type AuthContext = {
  uid: string;
  userId: string;
  email: string;
  name?: string;
  role: AppRole;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantLogoUrl?: string | null;
};

export type AuthenticatedRequest = express.Request & {
  auth?: AuthContext;
};

export type AppUserRow = {
  id: string;
  firebase_uid: string;
  email: string;
  role: AppRole;
  name: string | null;
  status: string;
  created_at: string;
};

export type TenantMembershipRow = {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  tenant_logo_url: string | null;
  role: AppRole;
};
