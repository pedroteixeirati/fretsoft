import { adminAuth } from '../../../shared/infra/firebase/firebaseAdmin';
import { pool } from '../../../shared/infra/database/pool';
import type { AppRole } from '../../../shared/authorization/permissions';
import {
  isValidCnpj,
  isValidEmail,
  isValidPhone,
  isValidPlan,
  isValidSlug,
  isValidState,
  isValidTenantStatus,
  normalizeCnpj,
  normalizeOptionalEmail,
  normalizeOptionalText,
  normalizePhone,
  normalizeRequiredText,
  slugify,
} from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  findDuplicateTenantForCreate,
  findDuplicateTenantForUpdate,
  findPlatformTenantById,
  findTenantProfileById,
  findUserByEmail,
  insertPlatformTenant,
  linkOwnerToTenant,
  listPlatformTenantsRows,
  updateTenantProfileById,
  upsertOwnerUser,
} from '../repositories/tenants.repository';
import type { PlatformTenantRow, TenantProfileRow, UpdateTenantProfileInput } from '../dtos/tenant.types';

function canManageTenantProfile(role?: AppRole) {
  return !!role && ['dev', 'owner', 'admin'].includes(role);
}

function canManagePlatformTenants(role?: AppRole) {
  return !!role && role === 'dev';
}

function mapTenantProfile(row: TenantProfileRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    name: row.name,
    tradeName: row.trade_name || '',
    slug: row.slug,
    cnpj: row.cnpj || '',
    stateRegistration: row.state_registration || '',
    municipalRegistration: row.municipal_registration || '',
    taxRegime: row.tax_regime || '',
    mainCnae: row.main_cnae || '',
    secondaryCnaes: row.secondary_cnaes || '',
    openedAt: row.opened_at || '',
    legalRepresentative: row.legal_representative || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    email: row.email || '',
    financialEmail: row.financial_email || '',
    fiscalEmail: row.fiscal_email || '',
    website: row.website || '',
    logoUrl: row.logo_url || '',
    zipCode: row.zip_code || '',
    ibgeCode: row.ibge_code || '',
    addressLine: row.address_line || '',
    addressNumber: row.address_number || '',
    addressComplement: row.address_complement || '',
    district: row.district || '',
    city: row.city || '',
    state: row.state || '',
    plan: row.plan,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.created_by_name || '',
    updatedByName: row.updated_by_name || '',
  };
}

function mapPlatformTenant(row: PlatformTenantRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    name: row.name,
    tradeName: row.trade_name || '',
    slug: row.slug,
    cnpj: row.cnpj || '',
    city: row.city || '',
    state: row.state || '',
    phone: row.phone || '',
    legalRepresentative: row.legal_representative || '',
    plan: row.plan,
    status: row.status,
    ownerName: row.owner_name || '',
    ownerEmail: row.owner_email || '',
    ownerLinked: row.owner_linked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByName: row.created_by_name || '',
    updatedByName: row.updated_by_name || '',
  };
}

export function canViewTenantProfile(role?: AppRole) {
  return canManageTenantProfile(role);
}

export function canEditTenantProfile(role?: AppRole) {
  return canManageTenantProfile(role);
}

export function canViewPlatformTenants(role?: AppRole) {
  return canManagePlatformTenants(role);
}

export function canCreatePlatformTenants(role?: AppRole) {
  return canManagePlatformTenants(role);
}

export async function getTenantProfile(auth?: AuthContext) {
  const profile = await findTenantProfileById(auth?.tenantId);
  return profile ? mapTenantProfile(profile) : null;
}

export async function updateTenantProfile(auth: AuthContext | undefined, body: Record<string, string>) {
  const {
    name,
    tradeName,
    slug,
    cnpj,
    stateRegistration,
    municipalRegistration,
    taxRegime,
    mainCnae,
    secondaryCnaes,
    openedAt,
    legalRepresentative,
    phone,
    whatsapp,
    email,
    financialEmail,
    fiscalEmail,
    website,
    logoUrl,
    zipCode,
    ibgeCode,
    addressLine,
    addressNumber,
    addressComplement,
    district,
    city,
    state,
    plan,
    status,
  } = body;

  const normalizedName = normalizeRequiredText(name) || auth?.tenantName || 'Transportadora';
  const normalizedTradeName = normalizeOptionalText(tradeName);
  const normalizedSlug = slugify(slug || normalizedTradeName || normalizedName || auth?.tenantSlug || 'transportadora') || auth?.tenantSlug || 'transportadora';
  const normalizedCnpj = normalizeCnpj(cnpj);
  const normalizedState = normalizeOptionalText(state)?.toUpperCase() || null;
  const normalizedPhone = normalizePhone(phone);
  const normalizedWhatsapp = normalizePhone(whatsapp);
  const normalizedPrimaryEmail = normalizeOptionalEmail(email);
  const normalizedFinancialEmail = normalizeOptionalEmail(financialEmail);
  const normalizedFiscalEmail = normalizeOptionalEmail(fiscalEmail);
  const canManageBilling = auth?.role === 'dev';
  const nextPlan = canManageBilling ? (plan || 'starter') : null;
  const nextStatus = canManageBilling ? ((status || 'active') as 'active' | 'inactive' | 'suspended') : null;

  if (normalizedName.length < 3 || normalizedName.length > 120) {
    throw new Error('A razao social deve ter entre 3 e 120 caracteres.');
  }

  if (normalizedTradeName && normalizedTradeName.length > 120) {
    throw new Error('O nome fantasia deve ter no maximo 120 caracteres.');
  }

  if (!isValidSlug(normalizedSlug)) {
    throw new Error('O slug informado e invalido. Use apenas letras minusculas, numeros e hifens.');
  }

  if (normalizedCnpj && !isValidCnpj(normalizedCnpj)) {
    throw new Error('Informe um CNPJ valido para a transportadora.');
  }

  if (!isValidState(normalizedState)) {
    throw new Error('A UF deve conter exatamente 2 letras.');
  }

  if (!isValidPlan(nextPlan) || !isValidTenantStatus(nextStatus)) {
    throw new Error('Plano ou status da transportadora invalido.');
  }

  if (!isValidPhone(normalizedPhone) || !isValidPhone(normalizedWhatsapp)) {
    throw new Error('Telefone e WhatsApp devem conter DDD e numero valido.');
  }

  for (const tenantEmail of [normalizedPrimaryEmail, normalizedFinancialEmail, normalizedFiscalEmail]) {
    if (tenantEmail && !isValidEmail(tenantEmail)) {
      throw new Error('Um dos e-mails informados para a transportadora e invalido.');
    }
  }

  const duplicateTenant = await findDuplicateTenantForUpdate(auth?.tenantId, normalizedSlug, normalizedCnpj);
  if (duplicateTenant) {
    throw new Error(normalizedCnpj ? 'Ja existe outra transportadora com esse slug ou CNPJ.' : 'Ja existe outra transportadora com esse slug.');
  }

  const payload: UpdateTenantProfileInput = {
    normalizedName,
    normalizedTradeName,
    normalizedSlug,
    normalizedCnpj,
    normalizedPhone,
    normalizedWhatsapp,
    normalizedPrimaryEmail,
    normalizedFinancialEmail,
    normalizedFiscalEmail,
    normalizedState,
    nextPlan,
    nextStatus,
    stateRegistration: normalizeOptionalText(stateRegistration),
    municipalRegistration: normalizeOptionalText(municipalRegistration),
    taxRegime: normalizeOptionalText(taxRegime),
    mainCnae: normalizeOptionalText(mainCnae),
    secondaryCnaes: normalizeOptionalText(secondaryCnaes),
    openedAt: normalizeOptionalText(openedAt),
    legalRepresentative: normalizeOptionalText(legalRepresentative),
    website: normalizeOptionalText(website),
    logoUrl: normalizeOptionalText(logoUrl),
    zipCode: normalizeOptionalText(zipCode),
    ibgeCode: normalizeOptionalText(ibgeCode),
    addressLine: normalizeOptionalText(addressLine),
    addressNumber: normalizeOptionalText(addressNumber),
    addressComplement: normalizeOptionalText(addressComplement),
    district: normalizeOptionalText(district),
    city: normalizeOptionalText(city),
  };

  const updated = await updateTenantProfileById(auth?.tenantId, auth?.userId, payload);
  return updated ? mapTenantProfile(updated) : null;
}

export async function listPlatformTenants() {
  const rows = await listPlatformTenantsRows();
  return rows.map(mapPlatformTenant);
}

export async function createPlatformTenant(auth: AuthContext | undefined, body: Record<string, string>) {
  const {
    name,
    tradeName,
    slug,
    cnpj,
    phone,
    legalRepresentative,
    city,
    state,
    plan,
    status,
    ownerEmail,
    ownerName,
    ownerPassword,
  } = body;

  const normalizedName = normalizeRequiredText(name);
  const normalizedTradeName = normalizeOptionalText(tradeName);
  const normalizedCity = normalizeOptionalText(city);
  const normalizedState = normalizeOptionalText(state)?.toUpperCase() || null;
  const normalizedPhone = normalizePhone(phone);
  const normalizedLegalRepresentative = normalizeOptionalText(legalRepresentative);
  const normalizedOwnerEmail = normalizeRequiredText(ownerEmail).toLowerCase();
  const normalizedOwnerName = normalizeRequiredText(ownerName);
  const normalizedPassword = ownerPassword || '';
  const normalizedCnpj = normalizeCnpj(cnpj);
  const normalizedSlug = slugify(slug || tradeName || name) || `tenant-${Date.now()}`;
  const normalizedPlan = plan?.trim() || 'starter';
  const normalizedStatus = (status as 'active' | 'inactive' | 'suspended') || 'active';

  if (!normalizedName || !normalizedOwnerEmail || !normalizedOwnerName || !normalizedPassword) {
    throw new Error('Razao social, nome do owner, e-mail do owner e senha inicial sao obrigatorios.');
  }

  if (normalizedName.length < 3 || normalizedName.length > 120) {
    throw new Error('A razao social deve ter entre 3 e 120 caracteres.');
  }

  if (normalizedTradeName && normalizedTradeName.length > 120) {
    throw new Error('O nome fantasia deve ter no maximo 120 caracteres.');
  }

  if (!isValidEmail(normalizedOwnerEmail)) {
    throw new Error('Informe um e-mail valido para o owner.');
  }

  if (normalizedPassword.length < 6) {
    throw new Error('A senha inicial do owner deve ter pelo menos 6 caracteres.');
  }

  if (!isValidState(normalizedState)) {
    throw new Error('A UF deve conter exatamente 2 letras.');
  }

  if (!isValidPhone(normalizedPhone)) {
    throw new Error('Informe um telefone principal valido com DDD.');
  }

  if (!isValidSlug(normalizedSlug)) {
    throw new Error('O slug informado e invalido. Use apenas letras minusculas, numeros e hifens.');
  }

  if (normalizedCnpj && !isValidCnpj(normalizedCnpj)) {
    throw new Error('Informe um CNPJ valido para a transportadora.');
  }

  if (!isValidPlan(normalizedPlan) || !isValidTenantStatus(normalizedStatus)) {
    throw new Error('Plano ou status da transportadora invalido.');
  }

  const client = await pool.connect();
  let createdFirebaseUid: string | null = null;
  let transactionStarted = false;

  try {
    const duplicateTenant = await findDuplicateTenantForCreate(client, normalizedSlug, normalizedCnpj);
    if (duplicateTenant) {
      throw new Error(normalizedCnpj ? 'Ja existe uma transportadora cadastrada com esse slug ou CNPJ.' : 'Ja existe uma transportadora cadastrada com esse slug.');
    }

    const duplicateUser = await findUserByEmail(client, normalizedOwnerEmail);
    if (duplicateUser) {
      throw new Error('Ja existe um usuario cadastrado com esse e-mail.');
    }

    try {
      const firebaseUser = await adminAuth.createUser({
        email: normalizedOwnerEmail,
        password: normalizedPassword,
        displayName: normalizedOwnerName,
      });
      createdFirebaseUid = firebaseUser.uid;
    } catch (firebaseError: any) {
      const code = firebaseError?.code || '';
      if (code.includes('email-already-exists')) {
        throw new Error('Ja existe um usuario no Firebase com esse e-mail.');
      }
      if (code.includes('invalid-password')) {
        throw new Error('A senha inicial do owner nao atende aos requisitos do Firebase.');
      }
      throw firebaseError;
    }

    await client.query('begin');
    transactionStarted = true;

    const tenant = await insertPlatformTenant(client, auth?.userId, {
      normalizedName,
      normalizedTradeName,
      normalizedSlug,
      normalizedCnpj,
      normalizedPhone,
      normalizedLegalRepresentative,
      normalizedCity,
      normalizedState,
      normalizedOwnerEmail,
      normalizedOwnerName,
      normalizedPassword,
      plan: normalizedPlan,
      status: normalizedStatus,
    });

    const user = await upsertOwnerUser(client, createdFirebaseUid!, normalizedOwnerEmail, normalizedOwnerName);
    await linkOwnerToTenant(client, tenant.id, user.id);
    await client.query('commit');

    const created = await findPlatformTenantById(tenant.id, user.id);
    return created ? mapPlatformTenant(created) : null;
  } catch (error) {
    if (transactionStarted) {
      await client.query('rollback');
    }
    if (createdFirebaseUid) {
      await adminAuth.deleteUser(createdFirebaseUid).catch(() => undefined);
    }
    throw error;
  } finally {
    client.release();
  }
}
