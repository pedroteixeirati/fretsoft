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

  if (corporateName.length < 3) throw new Error('Informe a razao social da empresa.');
  if (tradeName.length < 2) throw new Error('Informe o nome fantasia da empresa.');
  if (!isValidCnpj(cnpj)) throw new Error('Informe um CNPJ valido para a empresa.');
  if (stateRegistration.length < 2) throw new Error('Informe a inscricao estadual da empresa.');
  if (municipalRegistration.length < 2) throw new Error('Informe a inscricao municipal da empresa.');
  if (legalRepresentative.length < 3) throw new Error('Informe o representante legal da empresa.');
  if (!isValidCpf(representativeCpf)) throw new Error('Informe um CPF valido para o representante.');
  if (!isValidEmail(email)) throw new Error('Informe um e-mail valido para a empresa.');
  if (!isValidPhone(phone)) throw new Error('Informe um telefone valido para a empresa.');
  if (address.length < 5) throw new Error('Informe um endereco valido para a empresa.');
  if (city.length < 2) throw new Error('Informe a cidade da empresa.');
  if (!isValidState(state)) throw new Error('Informe uma UF valida para a empresa.');
  if (zipCode.replace(/\D/g, '').length !== 8) throw new Error('Informe um CEP valido para a empresa.');
  if (!['active', 'inactive'].includes(status)) throw new Error('Status da empresa invalido.');

  const duplicate = await pool.query<{ id: string }>(
    `select id
     from companies
     where tenant_id = $1
       and regexp_replace(cnpj, '\D', '', 'g') = $2
       and ($3::uuid is null or id <> $3::uuid)
     limit 1`,
    [tenantId, cnpj, recordId || null]
  );

  if (duplicate.rows[0]) throw new Error('Ja existe uma empresa cadastrada com esse CNPJ.');

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
