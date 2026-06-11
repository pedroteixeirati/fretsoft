import { pool } from '../../../shared/infra/database/pool';

export async function listTenantFeatureRows(tenantId: string) {
  const result = await pool.query<{ feature_key: string; enabled: boolean }>(
    `select feature_key, enabled
     from tenant_features
     where tenant_id = $1`,
    [tenantId]
  );

  return result.rows;
}

export async function upsertTenantFeature(tenantId: string, featureKey: string, enabled: boolean, userId?: string) {
  await pool.query(
    `insert into tenant_features (tenant_id, feature_key, enabled, created_by_user_id, updated_by_user_id)
     values ($1, $2, $3, $4, $4)
     on conflict (tenant_id, feature_key) do update set
       enabled = excluded.enabled,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_at = now()`,
    [tenantId, featureKey, enabled, userId || null]
  );
}
