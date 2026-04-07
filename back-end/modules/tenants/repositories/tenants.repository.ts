import type { PoolClient } from 'pg';
import { pool } from '../../../shared/infra/database/pool';
import type { AppUserRow } from '../../auth/dtos/auth-context';
import type {
  CreatePlatformTenantInput,
  PlatformTenantRow,
  TenantProfileRow,
  UpdateTenantProfileInput,
} from '../dtos/tenant.types';

export async function findTenantProfileById(tenantId?: string) {
  const result = await pool.query<TenantProfileRow>(
    `select t.id,
            t.display_id,
            t.name,
            t.trade_name,
            t.slug,
            t.cnpj,
            t.state_registration,
            t.municipal_registration,
            t.tax_regime,
            t.main_cnae,
            t.secondary_cnaes,
            t.opened_at,
            t.legal_representative,
            t.phone,
            t.whatsapp,
            t.email,
            t.financial_email,
            t.fiscal_email,
            t.website,
            t.logo_url,
            t.zip_code,
            t.ibge_code,
            t.address_line,
            t.address_number,
            t.address_complement,
            t.district,
            t.city,
            t.state,
            t.plan,
            t.status,
            t.created_at,
            t.updated_at,
            coalesce(created_by_user.name, '') as created_by_name,
            coalesce(updated_by_user.name, '') as updated_by_name
     from tenants t
     left join users created_by_user on created_by_user.id = t.created_by_user_id
     left join users updated_by_user on updated_by_user.id = t.updated_by_user_id
     where t.id = $1
     limit 1`,
    [tenantId]
  );

  return result.rows[0] || null;
}

export async function findDuplicateTenantForUpdate(tenantId: string | undefined, slug: string, cnpj: string) {
  const result = await pool.query<{ id: string }>(
    `select id
     from tenants
     where id <> $1
       and (
         slug = $2
         or ($3 <> '' and regexp_replace(coalesce(cnpj, ''), '\D', '', 'g') = $3)
       )
     limit 1`,
    [tenantId, slug, cnpj]
  );

  return result.rows[0] || null;
}

export async function updateTenantProfileById(tenantId: string | undefined, userId: string | undefined, payload: UpdateTenantProfileInput) {
  const result = await pool.query<TenantProfileRow>(
    `update tenants
     set name = $1,
         trade_name = $2,
         slug = $3,
         cnpj = $4,
         state_registration = $5,
         municipal_registration = $6,
         tax_regime = $7,
         main_cnae = $8,
         secondary_cnaes = $9,
         opened_at = $10,
         legal_representative = $11,
         phone = $12,
         whatsapp = $13,
         email = $14,
         financial_email = $15,
         fiscal_email = $16,
         website = $17,
         logo_url = $18,
         zip_code = $19,
         ibge_code = $20,
         address_line = $21,
         address_number = $22,
         address_complement = $23,
         district = $24,
         city = $25,
         state = $26,
         plan = coalesce($27, plan),
         status = coalesce($28, status),
         updated_by_user_id = $29,
         updated_at = now()
     where id = $30
     returning id,
               display_id,
               name,
               trade_name,
               slug,
               cnpj,
               state_registration,
               municipal_registration,
               tax_regime,
               main_cnae,
               secondary_cnaes,
               opened_at,
               legal_representative,
               phone,
               whatsapp,
               email,
               financial_email,
               fiscal_email,
               website,
               logo_url,
               zip_code,
               ibge_code,
               address_line,
               address_number,
               address_complement,
               district,
               city,
               state,
               plan,
               status,
               created_at,
               updated_at,
               (
                 select coalesce(u.name, '')
                 from users u
                 where u.id = created_by_user_id
               ) as created_by_name,
               (
                 select coalesce(u.name, '')
                 from users u
                 where u.id = updated_by_user_id
               ) as updated_by_name`,
    [
      payload.normalizedName,
      payload.normalizedTradeName,
      payload.normalizedSlug,
      payload.normalizedCnpj || null,
      payload.stateRegistration,
      payload.municipalRegistration,
      payload.taxRegime,
      payload.mainCnae,
      payload.secondaryCnaes,
      payload.openedAt,
      payload.legalRepresentative,
      payload.normalizedPhone || null,
      payload.normalizedWhatsapp || null,
      payload.normalizedPrimaryEmail,
      payload.normalizedFinancialEmail,
      payload.normalizedFiscalEmail,
      payload.website,
      payload.logoUrl,
      payload.zipCode,
      payload.ibgeCode,
      payload.addressLine,
      payload.addressNumber,
      payload.addressComplement,
      payload.district,
      payload.city,
      payload.normalizedState,
      payload.nextPlan,
      payload.nextStatus,
      userId,
      tenantId,
    ]
  );

  return result.rows[0] || null;
}

export async function listPlatformTenantsRows() {
  const result = await pool.query<PlatformTenantRow>(
    `select t.id,
            t.display_id,
            t.name,
            t.trade_name,
            t.slug,
            t.cnpj,
            t.city,
            t.state,
            t.phone,
            t.legal_representative,
            t.plan,
            t.status,
            t.created_at,
            t.updated_at,
            coalesce(created_by_user.name, '') as created_by_name,
            coalesce(updated_by_user.name, '') as updated_by_name,
            coalesce(u.name, '') as owner_name,
            coalesce(u.email, '') as owner_email,
            (u.id is not null) as owner_linked
     from tenants t
     left join users created_by_user on created_by_user.id = t.created_by_user_id
     left join users updated_by_user on updated_by_user.id = t.updated_by_user_id
     left join lateral (
       select tu.user_id
       from tenant_users tu
       where tu.tenant_id = t.id
         and tu.role = 'owner'
       order by tu.created_at asc
       limit 1
     ) tenant_owner on true
     left join users u on u.id = tenant_owner.user_id
     order by t.created_at desc`
  );

  return result.rows;
}

export async function findDuplicateTenantForCreate(client: PoolClient, slug: string, cnpj: string) {
  const result = await client.query<{ id: string }>(
    `select id
     from tenants
     where slug = $1
        or ($2 <> '' and regexp_replace(coalesce(cnpj, ''), '\D', '', 'g') = $2)
     limit 1`,
    [slug, cnpj]
  );

  return result.rows[0] || null;
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

export async function insertPlatformTenant(client: PoolClient, createdByUserId: string | undefined, payload: CreatePlatformTenantInput) {
  const result = await client.query<{ id: string; display_id: number }>(
    `insert into tenants (name, trade_name, slug, cnpj, phone, legal_representative, city, state, plan, status, created_by_user_id, updated_by_user_id)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning id, display_id`,
    [
      payload.normalizedName,
      payload.normalizedTradeName,
      payload.normalizedSlug,
      payload.normalizedCnpj || null,
      payload.normalizedPhone || null,
      payload.normalizedLegalRepresentative,
      payload.normalizedCity,
      payload.normalizedState,
      payload.plan,
      payload.status,
      createdByUserId,
      createdByUserId,
    ]
  );

  return result.rows[0];
}

export async function upsertOwnerUser(client: PoolClient, firebaseUid: string, email: string, name: string) {
  const result = await client.query<AppUserRow>(
    `insert into users (firebase_uid, email, role, name, status)
     values ($1, $2, 'owner', $3, 'active')
     on conflict (firebase_uid) do update set
       email = excluded.email,
       role = 'owner',
       name = excluded.name,
       status = 'active',
       updated_at = now()
     returning id, firebase_uid, email, role, name, status, created_at`,
    [firebaseUid, email, name]
  );

  return result.rows[0];
}

export async function linkOwnerToTenant(client: PoolClient, tenantId: string, userId: string) {
  await client.query(
    `insert into tenant_users (tenant_id, user_id, role, status)
     values ($1, $2, 'owner', 'active')
     on conflict (tenant_id, user_id) do update set
       role = 'owner',
       status = 'active',
       updated_at = now()`,
    [tenantId, userId]
  );
}

export async function findPlatformTenantById(tenantId: string, ownerUserId: string) {
  const result = await pool.query<PlatformTenantRow>(
    `select t.id,
            t.display_id,
            t.name,
            t.trade_name,
            t.slug,
            t.cnpj,
            t.city,
            t.state,
            t.phone,
            t.legal_representative,
            t.plan,
            t.status,
            t.created_at,
            t.updated_at,
            coalesce(created_by_user.name, '') as created_by_name,
            coalesce(updated_by_user.name, '') as updated_by_name,
            coalesce(u.name, '') as owner_name,
            coalesce(u.email, '') as owner_email,
            true as owner_linked
     from tenants t
     left join users created_by_user on created_by_user.id = t.created_by_user_id
     left join users updated_by_user on updated_by_user.id = t.updated_by_user_id
     left join users u on u.id = $2
     where t.id = $1
     limit 1`,
    [tenantId, ownerUserId]
  );

  return result.rows[0] || null;
}
