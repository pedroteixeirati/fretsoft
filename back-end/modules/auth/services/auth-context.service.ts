import type { DecodedIdToken } from 'firebase-admin/auth';
import { config } from '../../../shared/config/env';
import {
  createUserFromIdentity,
  findTenantFeatures,
  findTenantMembership,
  findUserByFirebaseUid,
  updateUserProfile,
} from '../repositories/auth.repository';

async function resolveTenantFeatures(tenantId: string) {
  const rows = await findTenantFeatures(tenantId);
  const features: Record<string, boolean> = {};

  for (const row of rows) {
    if (!row.enabled) continue;
    // Kill-switch global: desliga todo o modulo fiscal independente do flag por tenant.
    if (!config.fiscalModuleEnabled && row.feature_key.startsWith('fiscal')) continue;
    features[row.feature_key] = true;
  }

  return features;
}

export async function ensureUser(decoded: DecodedIdToken) {
  const existing = await findUserByFirebaseUid(decoded.uid);

  if (!existing) {
    return createUserFromIdentity(decoded.uid, decoded.email || '', null);
  }

  const normalizedEmail = decoded.email || existing.email;

  if (normalizedEmail !== existing.email) {
    return updateUserProfile(existing.id, normalizedEmail, existing.name || null);
  }

  return existing;
}

export async function resolveAuthContext(decoded: DecodedIdToken) {
  const user = await ensureUser(decoded);
  const membership = await findTenantMembership(user.id);

  if (!membership) {
    return null;
  }

  const features = await resolveTenantFeatures(membership.tenant_id);

  return {
    uid: decoded.uid,
    userId: user.id,
    email: user.email,
    name: user.name || undefined,
    role: membership.role,
    tenantId: membership.tenant_id,
    tenantName: membership.tenant_name,
    tenantSlug: membership.tenant_slug,
    tenantLogoUrl: membership.tenant_logo_url,
    features,
  };
}
