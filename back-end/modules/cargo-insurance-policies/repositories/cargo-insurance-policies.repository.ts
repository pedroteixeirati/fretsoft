import { pool } from '../../../shared/infra/database/pool';

export type CargoInsurancePolicyRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  insurance_company_name: string;
  insurance_company_document: string;
  policy_number: string;
  endorsement_numbers: string[] | null;
  responsible_type: 'carrier' | 'shipper' | 'taker' | 'other';
  coverage_type: 'rctr_c' | 'rcf_dc' | 'other';
  starts_at: string | null;
  ends_at: string | null;
  status: 'active' | 'inactive' | 'expired';
  is_default: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const policyColumns = `
  id,
  display_id,
  tenant_id,
  insurance_company_name,
  insurance_company_document,
  policy_number,
  endorsement_numbers,
  responsible_type,
  coverage_type,
  starts_at,
  ends_at,
  status,
  is_default,
  notes,
  created_at,
  updated_at
`;

export async function listTenantCargoInsurancePolicies(tenantId?: string) {
  const result = await pool.query<CargoInsurancePolicyRow>(
    `select ${policyColumns}
     from cargo_insurance_policies
     where tenant_id = $1
     order by is_default desc, status asc, created_at desc`,
    [tenantId],
  );

  return result.rows;
}

export async function findDefaultCargoInsurancePolicy(tenantId?: string) {
  const result = await pool.query<CargoInsurancePolicyRow>(
    `select ${policyColumns}
     from cargo_insurance_policies
     where tenant_id = $1
       and status = 'active'
       and is_default = true
       and (starts_at is null or starts_at <= current_date)
       and (ends_at is null or ends_at >= current_date)
     limit 1`,
    [tenantId],
  );

  return result.rows[0] || null;
}

export async function insertTenantCargoInsurancePolicy(
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    if (payload.isDefault === true && tenantId) {
      await client.query(
        `update cargo_insurance_policies
         set is_default = false,
             updated_by_user_id = $1,
             updated_at = now()
         where tenant_id = $2
           and is_default = true`,
        [userId || null, tenantId],
      );
    }

    const result = await client.query<CargoInsurancePolicyRow>(
      `insert into cargo_insurance_policies (
        tenant_id,
        created_by_user_id,
        updated_by_user_id,
        insurance_company_name,
        insurance_company_document,
        policy_number,
        endorsement_numbers,
        responsible_type,
        coverage_type,
        starts_at,
        ends_at,
        status,
        is_default,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      returning ${policyColumns}`,
      [
        tenantId,
        userId || null,
        userId || null,
        payload.insuranceCompanyName,
        payload.insuranceCompanyDocument,
        payload.policyNumber,
        JSON.stringify(payload.endorsementNumbers || []),
        payload.responsibleType,
        payload.coverageType,
        payload.startsAt || null,
        payload.endsAt || null,
        payload.status,
        payload.isDefault,
        payload.notes,
      ],
    );
    await client.query('commit');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTenantCargoInsurancePolicy(
  id: string,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    if (payload.isDefault === true && tenantId) {
      await client.query(
        `update cargo_insurance_policies
         set is_default = false,
             updated_by_user_id = $1,
             updated_at = now()
         where tenant_id = $2
           and id <> $3
           and is_default = true`,
        [userId || null, tenantId, id],
      );
    }

    const result = await client.query<CargoInsurancePolicyRow>(
      `update cargo_insurance_policies
       set insurance_company_name = $1,
           insurance_company_document = $2,
           policy_number = $3,
           endorsement_numbers = $4,
           responsible_type = $5,
           coverage_type = $6,
           starts_at = $7,
           ends_at = $8,
           status = $9,
           is_default = $10,
           notes = $11,
           updated_by_user_id = $12,
           updated_at = now()
       where id = $13
         and tenant_id = $14
       returning ${policyColumns}`,
      [
        payload.insuranceCompanyName,
        payload.insuranceCompanyDocument,
        payload.policyNumber,
        JSON.stringify(payload.endorsementNumbers || []),
        payload.responsibleType,
        payload.coverageType,
        payload.startsAt || null,
        payload.endsAt || null,
        payload.status,
        payload.isDefault,
        payload.notes,
        userId || null,
        id,
        tenantId,
      ],
    );
    await client.query('commit');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteTenantCargoInsurancePolicy(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from cargo_insurance_policies
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}
