import { pool } from '../../../shared/infra/database/pool';
import type { AppUserRow, TenantMembershipRow } from '../dtos/auth-context';

export async function findUserByFirebaseUid(firebaseUid: string) {
  const result = await pool.query<AppUserRow>(
    `select id, firebase_uid, email, role, name, status, created_at
     from users
     where firebase_uid = $1
     limit 1`,
    [firebaseUid]
  );

  return result.rows[0] || null;
}

export async function updateUserProfile(userId: string, email: string, name: string | null) {
  const result = await pool.query<AppUserRow>(
    `update users
     set email = $1,
         name = $2,
         updated_at = now()
     where id = $3
     returning id, firebase_uid, email, role, name, status, created_at`,
    [email, name, userId]
  );

  return result.rows[0];
}

export async function createUserFromIdentity(firebaseUid: string, email: string, name: string | null) {
  const result = await pool.query<AppUserRow>(
    `insert into users (firebase_uid, email, role, name, status)
     values ($1, $2, $3, $4, 'active')
     returning id, firebase_uid, email, role, name, status, created_at`,
    [firebaseUid, email, 'viewer', name]
  );

  return result.rows[0];
}

export async function findTenantMembership(userId: string) {
  const result = await pool.query<TenantMembershipRow>(
    `select tu.tenant_id,
            t.name as tenant_name,
            t.slug as tenant_slug,
            t.logo_url as tenant_logo_url,
            tu.role
     from tenant_users tu
     inner join tenants t on t.id = tu.tenant_id
     where tu.user_id = $1
     order by tu.created_at asc
     limit 1`,
    [userId]
  );

  return result.rows[0] || null;
}
