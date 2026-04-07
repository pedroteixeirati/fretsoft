import type { PoolClient } from 'pg';
import type { AppUserRow } from '../../auth/dtos/auth-context';

export async function findUserByEmail(client: PoolClient, email: string) {
  const result = await client.query<{ id: string }>(
    `select id
     from users
     where lower(email) = $1
     limit 1`,
    [email]
  );

  return result.rows[0] || null;
}

export async function insertTenantUser(client: PoolClient, firebaseUid: string, email: string, role: string, name: string | null) {
  const result = await client.query<AppUserRow>(
    `insert into users (firebase_uid, email, role, name, status)
     values ($1, $2, $3, $4, 'active')
     returning id, firebase_uid, email, role, name, status, created_at`,
    [firebaseUid, email, role, name]
  );

  return result.rows[0];
}

export async function linkUserToTenant(client: PoolClient, tenantId: string, userId: string, role: string) {
  await client.query(
    `insert into tenant_users (tenant_id, user_id, role, status)
     values ($1, $2, $3, 'active')
     on conflict (tenant_id, user_id) do update set
       role = excluded.role,
       status = excluded.status,
       updated_at = now()`,
    [tenantId, userId, role]
  );
}
