import { conflictError, validationError } from '../../../shared/errors/app-error';
import { pool } from '../../../shared/infra/database/pool';
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
