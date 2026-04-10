import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { conflictError, validationError } from '../../../shared/errors/app-error';
import { pool } from '../../../shared/infra/database/pool';
import {
  deleteTenantCompany,
  insertTenantCompany,
  listTenantCompanies,
  type CompanyRow,
  updateTenantCompany,
} from '../repositories/companies.repository';
import {
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  isValidState,
  normalizeCnpj,
  normalizeCpf,
  normalizeOptionalText,
  normalizePhone,
  normalizeRequiredText,
} from '../../../shared/validation/validation';

export const companiesPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function mapCompanyRow(row: CompanyRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    corporateName: row.corporate_name,
    tradeName: row.trade_name,
    cnpj: row.cnpj,
    stateRegistration: row.state_registration,
    municipalRegistration: row.municipal_registration,
    legalRepresentative: row.legal_representative,
    representativeCpf: row.representative_cpf,
    email: row.email,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    zipCode: row.zip_code,
    contractContact: row.contract_contact || '',
    notes: row.notes || '',
    status: row.status,
  };
}

export async function validateCompanyPayload(
  body: Record<string, unknown>,
  tenantId: string,
  recordId?: string
) {
  const corporateName = normalizeRequiredText(body.corporateName as string);
  const tradeName = normalizeRequiredText(body.tradeName as string);
  const cnpj = normalizeCnpj(body.cnpj as string);
  const stateRegistration = normalizeRequiredText(body.stateRegistration as string);
  const municipalRegistration = normalizeRequiredText(body.municipalRegistration as string);
  const legalRepresentative = normalizeRequiredText(body.legalRepresentative as string);
  const representativeCpf = normalizeCpf(body.representativeCpf as string);
  const email = normalizeRequiredText(body.email as string).toLowerCase();
  const phone = normalizePhone(body.phone as string);
  const address = normalizeRequiredText(body.address as string);
  const city = normalizeRequiredText(body.city as string);
  const state = normalizeRequiredText(body.state as string).toUpperCase();
  const zipCode = normalizeRequiredText(body.zipCode as string);
  const contractContact = normalizeOptionalText(body.contractContact as string);
  const notes = normalizeOptionalText(body.notes as string);
  const status = body.status as string;

  if (corporateName.length < 3) throw validationError('Informe a razao social da empresa.', 'invalid_company_corporate_name', 'corporateName');
  if (tradeName.length < 2) throw validationError('Informe o nome fantasia da empresa.', 'invalid_company_trade_name', 'tradeName');
  if (!isValidCnpj(cnpj)) throw validationError('Informe um CNPJ valido para a empresa.', 'invalid_company_cnpj', 'cnpj');
  if (stateRegistration.length < 2) throw validationError('Informe a inscricao estadual da empresa.', 'invalid_company_state_registration', 'stateRegistration');
  if (municipalRegistration.length < 2) throw validationError('Informe a inscricao municipal da empresa.', 'invalid_company_municipal_registration', 'municipalRegistration');
  if (legalRepresentative.length < 3) throw validationError('Informe o representante legal da empresa.', 'invalid_company_legal_representative', 'legalRepresentative');
  if (!isValidCpf(representativeCpf)) throw validationError('Informe um CPF valido para o representante.', 'invalid_company_representative_cpf', 'representativeCpf');
  if (!isValidEmail(email)) throw validationError('Informe um e-mail valido para a empresa.', 'invalid_company_email', 'email');
  if (!isValidPhone(phone)) throw validationError('Informe um telefone valido para a empresa.', 'invalid_company_phone', 'phone');
  if (address.length < 5) throw validationError('Informe um endereco valido para a empresa.', 'invalid_company_address', 'address');
  if (city.length < 2) throw validationError('Informe a cidade da empresa.', 'invalid_company_city', 'city');
  if (!isValidState(state)) throw validationError('Informe uma UF valida para a empresa.', 'invalid_company_state', 'state');
  if (zipCode.replace(/\D/g, '').length !== 8) throw validationError('Informe um CEP valido para a empresa.', 'invalid_company_zip_code', 'zipCode');
  if (!['active', 'inactive'].includes(status)) throw validationError('Status da empresa invalido.', 'invalid_company_status', 'status');

  const duplicate = await pool.query<{ id: string }>(
    `select id
     from companies
     where tenant_id = $1
       and regexp_replace(cnpj, '\D', '', 'g') = $2
       and ($3::uuid is null or id <> $3::uuid)
     limit 1`,
    [tenantId, cnpj, recordId || null]
  );

  if (duplicate.rows[0]) throw conflictError('Ja existe uma empresa cadastrada com esse CNPJ.', 'company_cnpj_conflict', 'cnpj');

  return {
    corporateName,
    tradeName,
    cnpj,
    stateRegistration,
    municipalRegistration,
    legalRepresentative,
    representativeCpf,
    email,
    phone,
    address,
    city,
    state,
    zipCode,
    contractContact: contractContact || '',
    notes: notes || '',
    status,
  };
}

export async function listCompanies(auth?: AuthContext) {
  const rows = await listTenantCompanies(auth?.tenantId);
  return rows.map(mapCompanyRow);
}

export async function createCompany(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validateCompanyPayload(body, auth?.tenantId || '');
  const row = await insertTenantCompany(payload as Record<string, unknown>, auth?.tenantId, auth?.userId);
  return row ? mapCompanyRow(row) : null;
}

export async function updateCompany(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validateCompanyPayload(body, auth?.tenantId || '', id);
  const row = await updateTenantCompany(id, payload as Record<string, unknown>, auth?.tenantId, auth?.userId);
  return row ? mapCompanyRow(row) : undefined;
}

export async function deleteCompany(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantCompany(id, auth?.tenantId);
  return Boolean(row);
}
