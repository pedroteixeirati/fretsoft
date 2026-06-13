import { pool } from '../../../shared/infra/database/pool';

export type TenantNfseConfigRow = {
  id: string;
  tenant_id: string;
  service_code: string | null;
  service_list_item: string | null;
  cnae_code: string | null;
  iss_rate: string | number | null;
  iss_retained: boolean;
  special_regime: string | null;
  municipal_incidence_ibge: string | null;
  default_service_description: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

const configColumns = `
  id,
  tenant_id,
  service_code,
  service_list_item,
  cnae_code,
  iss_rate,
  iss_retained,
  special_regime,
  municipal_incidence_ibge,
  default_service_description,
  enabled,
  created_at,
  updated_at
`;

export async function findTenantNfseConfig(tenantId?: string) {
  const result = await pool.query<TenantNfseConfigRow>(
    `select ${configColumns}
     from tenant_nfse_config
     where tenant_id = $1
     limit 1`,
    [tenantId],
  );

  return result.rows[0] || null;
}

export async function upsertTenantNfseConfig(payload: Record<string, unknown>, tenantId?: string, userId?: string) {
  const result = await pool.query<TenantNfseConfigRow>(
    `insert into tenant_nfse_config (
       tenant_id,
       created_by_user_id,
       updated_by_user_id,
       service_code,
       service_list_item,
       cnae_code,
       iss_rate,
       iss_retained,
       special_regime,
       municipal_incidence_ibge,
       default_service_description,
       enabled
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     on conflict (tenant_id) do update set
       service_code = excluded.service_code,
       service_list_item = excluded.service_list_item,
       cnae_code = excluded.cnae_code,
       iss_rate = excluded.iss_rate,
       iss_retained = excluded.iss_retained,
       special_regime = excluded.special_regime,
       municipal_incidence_ibge = excluded.municipal_incidence_ibge,
       default_service_description = excluded.default_service_description,
       enabled = excluded.enabled,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_at = now()
     returning ${configColumns}`,
    [
      tenantId,
      userId || null,
      payload.serviceCode,
      payload.serviceListItem,
      payload.cnaeCode,
      payload.issRate,
      payload.issRetained,
      payload.specialRegime,
      payload.municipalIncidenceIbge,
      payload.defaultServiceDescription,
      payload.enabled,
    ],
  );

  return result.rows[0] || null;
}
