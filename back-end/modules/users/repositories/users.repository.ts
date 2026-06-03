import type { PoolClient } from 'pg';
import type { AppUserRow } from '../../auth/dtos/auth-context';

export type TenantUserRow = {
  id: string;
  firebase_uid: string;
  email: string;
  role: string;
  name: string | null;
  status: string;
  tenant_role: string;
  tenant_status: string;
  created_at: string;
};

export async function listTenantUsers(client: PoolClient, tenantId: string) {
  const result = await client.query<TenantUserRow>(
    `select u.id,
            u.firebase_uid,
            u.email,
            coalesce(tu.role, u.role) as role,
            u.name,
            u.status,
            tu.role as tenant_role,
            tu.status as tenant_status,
            u.created_at
       from tenant_users tu
       join users u on u.id = tu.user_id
      where tu.tenant_id = $1
        and tu.status = 'active'
        and u.status = 'active'
      order by coalesce(nullif(u.name, ''), u.email) asc`,
    [tenantId]
  );

  return result.rows;
}

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
