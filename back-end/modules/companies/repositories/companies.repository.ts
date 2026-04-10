import { pool } from '../../../shared/infra/database/pool';

export type CompanyRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  corporate_name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string;
  municipal_registration: string;
  legal_representative: string;
  representative_cpf: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  contract_contact: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
};

const companyColumns = `
  id,
  display_id,
  tenant_id,
  corporate_name,
  trade_name,
  cnpj,
  state_registration,
  municipal_registration,
  legal_representative,
  representative_cpf,
  email,
  phone,
  address,
  city,
  state,
  zip_code,
  contract_contact,
  notes,
  status
`;

export async function listTenantCompanies(tenantId?: string) {
  const result = await pool.query<CompanyRow>(
    `select ${companyColumns}
     from companies
     where tenant_id = $1
     order by created_at desc`,
    [tenantId]
  );

  return result.rows;
}

export async function insertTenantCompany(
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string
) {
  const result = await pool.query<CompanyRow>(
    `insert into companies (
      tenant_id,
      created_by_user_id,
      updated_by_user_id,
      corporate_name,
      trade_name,
      cnpj,
      state_registration,
      municipal_registration,
      legal_representative,
      representative_cpf,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      contract_contact,
      notes,
      status
    )
    values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19
    )
    returning ${companyColumns}`,
    [
      tenantId,
      userId,
      userId,
      payload.corporateName,
      payload.tradeName,
      payload.cnpj,
      payload.stateRegistration,
      payload.municipalRegistration,
      payload.legalRepresentative,
      payload.representativeCpf,
      payload.email,
      payload.phone,
      payload.address,
      payload.city,
      payload.state,
      payload.zipCode,
      payload.contractContact,
      payload.notes,
      payload.status,
    ]
  );

  return result.rows[0] || null;
}

export async function updateTenantCompany(
  id: string,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string
) {
  const result = await pool.query<CompanyRow>(
    `update companies
     set corporate_name = $1,
         trade_name = $2,
         cnpj = $3,
         state_registration = $4,
         municipal_registration = $5,
         legal_representative = $6,
         representative_cpf = $7,
         email = $8,
         phone = $9,
         address = $10,
         city = $11,
         state = $12,
         zip_code = $13,
         contract_contact = $14,
         notes = $15,
         status = $16,
         updated_by_user_id = $17,
         updated_at = now()
     where id = $18
       and tenant_id = $19
     returning ${companyColumns}`,
    [
      payload.corporateName,
      payload.tradeName,
      payload.cnpj,
      payload.stateRegistration,
      payload.municipalRegistration,
      payload.legalRepresentative,
      payload.representativeCpf,
      payload.email,
      payload.phone,
      payload.address,
      payload.city,
      payload.state,
      payload.zipCode,
      payload.contractContact,
      payload.notes,
      payload.status,
      userId,
      id,
      tenantId,
    ]
  );

  return result.rows[0] || null;
}

export async function deleteTenantCompany(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from companies
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}
