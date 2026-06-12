import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { normalizeDocumentNumber, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantCargoInsurancePolicy,
  insertTenantCargoInsurancePolicy,
  listTenantCargoInsurancePolicies,
  updateTenantCargoInsurancePolicy,
  type CargoInsurancePolicyRow,
} from '../repositories/cargo-insurance-policies.repository';

export const cargoInsurancePolicyPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin'],
  update: ['dev', 'owner', 'admin'],
  delete: ['dev', 'owner', 'admin'],
};

const responsibleTypes = ['carrier', 'shipper', 'taker', 'other'];
const coverageTypes = ['rctr_c', 'rcf_dc', 'other'];
const statuses = ['active', 'inactive', 'expired'];

function normalizeEndorsementNumbers(value: unknown) {
  const raw = Array.isArray(value)
    ? value
    : normalizeOptionalText(value as string)
      .split(/[\n,;]+/);

  return Array.from(new Set(
    raw
      .map((item) => normalizeOptionalText(String(item)) || '')
      .filter(Boolean),
  ));
}

export function mapCargoInsurancePolicyRow(row: CargoInsurancePolicyRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    insuranceCompanyName: row.insurance_company_name,
    insuranceCompanyDocument: row.insurance_company_document,
    policyNumber: row.policy_number,
    endorsementNumbers: Array.isArray(row.endorsement_numbers) ? row.endorsement_numbers : [],
    responsibleType: row.responsible_type,
    coverageType: row.coverage_type,
    startsAt: row.starts_at || '',
    endsAt: row.ends_at || '',
    status: row.status,
    isDefault: row.is_default,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeDate(value: unknown, field: string) {
  const normalized = normalizeOptionalText(value as string);
  if (!normalized) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw validationError('Informe uma data valida.', 'invalid_cargo_insurance_policy_date', field);
  }
  return normalized;
}

export async function validateCargoInsurancePolicyPayload(body: Record<string, unknown>) {
  const insuranceCompanyName = normalizeRequiredText(body.insuranceCompanyName as string);
  const insuranceCompanyDocument = normalizeDocumentNumber(body.insuranceCompanyDocument as string);
  const policyNumber = normalizeRequiredText(body.policyNumber as string);
  const endorsementNumbers = normalizeEndorsementNumbers(body.endorsementNumbers);
  const responsibleType = normalizeOptionalText(body.responsibleType as string) || 'carrier';
  const coverageType = normalizeOptionalText(body.coverageType as string) || 'rctr_c';
  const startsAt = normalizeDate(body.startsAt, 'startsAt');
  const endsAt = normalizeDate(body.endsAt, 'endsAt');
  const status = normalizeOptionalText(body.status as string) || 'active';
  const isDefault = body.isDefault === true;
  const notes = normalizeOptionalText(body.notes as string) || '';

  if (insuranceCompanyName.length < 3) {
    throw validationError('Informe o nome da seguradora.', 'invalid_cargo_insurance_company_name', 'insuranceCompanyName');
  }
  if (insuranceCompanyDocument.length !== 14) {
    throw validationError('Informe o CNPJ da seguradora.', 'invalid_cargo_insurance_company_document', 'insuranceCompanyDocument');
  }
  if (policyNumber.length < 2) {
    throw validationError('Informe o numero da apolice.', 'invalid_cargo_insurance_policy_number', 'policyNumber');
  }
  if (isDefault && status === 'active' && endorsementNumbers.length === 0) {
    throw validationError('Informe ao menos um numero de averbacao para a apolice padrao ativa.', 'invalid_cargo_insurance_endorsement_numbers', 'endorsementNumbers');
  }
  if (!responsibleTypes.includes(responsibleType)) {
    throw validationError('Informe um responsavel pelo seguro valido.', 'invalid_cargo_insurance_responsible_type', 'responsibleType');
  }
  if (!coverageTypes.includes(coverageType)) {
    throw validationError('Informe um tipo de cobertura valido.', 'invalid_cargo_insurance_coverage_type', 'coverageType');
  }
  if (!statuses.includes(status)) {
    throw validationError('Informe um status valido para a apolice.', 'invalid_cargo_insurance_status', 'status');
  }
  if (startsAt && endsAt && startsAt > endsAt) {
    throw validationError('A vigencia final deve ser posterior a inicial.', 'invalid_cargo_insurance_period', 'endsAt');
  }

  return {
    insuranceCompanyName,
    insuranceCompanyDocument,
    policyNumber,
    endorsementNumbers,
    responsibleType,
    coverageType,
    startsAt,
    endsAt,
    status,
    isDefault,
    notes,
  };
}

export async function listCargoInsurancePolicies(auth?: AuthContext) {
  const rows = await listTenantCargoInsurancePolicies(auth?.tenantId);
  return rows.map(mapCargoInsurancePolicyRow);
}

export async function createCargoInsurancePolicy(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validateCargoInsurancePolicyPayload(body);
  const row = await insertTenantCargoInsurancePolicy(payload, auth?.tenantId, auth?.userId);
  return row ? mapCargoInsurancePolicyRow(row) : null;
}

export async function updateCargoInsurancePolicy(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validateCargoInsurancePolicyPayload(body);
  const row = await updateTenantCargoInsurancePolicy(id, payload, auth?.tenantId, auth?.userId);
  return row ? mapCargoInsurancePolicyRow(row) : undefined;
}

export async function deleteCargoInsurancePolicy(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantCargoInsurancePolicy(id, auth?.tenantId);
  return Boolean(row);
}
