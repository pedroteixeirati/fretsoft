import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  createUserFromIdentity,
  findTenantMembership,
  findUserByFirebaseUid,
  updateUserProfile,
} from '../repositories/auth.repository';

export async function ensureUser(decoded: DecodedIdToken) {
  const existing = await findUserByFirebaseUid(decoded.uid);

  if (!existing) {
    return createUserFromIdentity(decoded.uid, decoded.email || '', decoded.name || null);
  }

  const normalizedEmail = decoded.email || existing.email;
  const normalizedName = decoded.name || existing.name;

  if (normalizedEmail !== existing.email || normalizedName !== existing.name) {
    return updateUserProfile(existing.id, normalizedEmail, normalizedName || null);
  }

  return existing;
}

export async function resolveAuthContext(decoded: DecodedIdToken) {
  const user = await ensureUser(decoded);
  const membership = await findTenantMembership(user.id);

  if (!membership) {
    return null;
  }

  return {
    uid: decoded.uid,
    userId: user.id,
    email: user.email,
    name: user.name || decoded.name,
    role: membership.role,
    tenantId: membership.tenant_id,
    tenantName: membership.tenant_name,
    tenantSlug: membership.tenant_slug,
    tenantLogoUrl: membership.tenant_logo_url,
  };
}
