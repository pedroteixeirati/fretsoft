import { validationError } from '../../../shared/errors/app-error';
import { normalizeOptionalText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  findTenantNfseConfig,
  upsertTenantNfseConfig,
  type TenantNfseConfigRow,
} from '../repositories/tenant-nfse-config.repository';

export function mapTenantNfseConfigRow(row: TenantNfseConfigRow | null) {
  if (!row) {
    return {
      serviceCode: '',
      serviceListItem: '',
      cnaeCode: '',
      issRate: null as number | null,
      issRetained: false,
      specialRegime: '',
      municipalIncidenceIbge: '',
      defaultServiceDescription: '',
      enabled: false,
      configured: false,
    };
  }

  return {
    serviceCode: row.service_code || '',
    serviceListItem: row.service_list_item || '',
    cnaeCode: row.cnae_code || '',
    issRate: row.iss_rate !== null && row.iss_rate !== undefined ? Number(row.iss_rate) : null,
    issRetained: row.iss_retained,
    specialRegime: row.special_regime || '',
    municipalIncidenceIbge: row.municipal_incidence_ibge || '',
    defaultServiceDescription: row.default_service_description || '',
    enabled: row.enabled,
    configured: true,
    updatedAt: row.updated_at,
  };
}

export async function getTenantNfseConfig(auth?: AuthContext) {
  const row = await findTenantNfseConfig(auth?.tenantId);
  return mapTenantNfseConfigRow(row);
}

function validatePayload(body: Record<string, unknown>) {
  const serviceCode = normalizeOptionalText(body.serviceCode as string);
  const serviceListItem = normalizeOptionalText(body.serviceListItem as string);
  const cnaeCode = normalizeOptionalText(body.cnaeCode as string);
  const specialRegime = normalizeOptionalText(body.specialRegime as string);
  const municipalIncidenceIbge = normalizeOptionalText(body.municipalIncidenceIbge as string);
  const defaultServiceDescription = normalizeOptionalText(body.defaultServiceDescription as string);
  const issRetained = body.issRetained === true;
  const enabled = body.enabled === true;

  let issRate: number | null = null;
  if (body.issRate !== undefined && body.issRate !== null && String(body.issRate).trim() !== '') {
    const numeric = Number(body.issRate);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
      throw validationError('Informe uma aliquota de ISS valida (0 a 100).', 'invalid_nfse_iss_rate', 'issRate');
    }
    issRate = Number(numeric.toFixed(2));
  }

  if (municipalIncidenceIbge && !/^\d{7}$/.test(municipalIncidenceIbge)) {
    throw validationError('O codigo IBGE do municipio deve ter 7 digitos.', 'invalid_nfse_municipal_ibge', 'municipalIncidenceIbge');
  }

  // So permite ativar a config quando os campos minimos para emitir estao preenchidos.
  if (enabled && (!serviceCode || issRate === null)) {
    throw validationError(
      'Para ativar a NFS-e informe ao menos o codigo de tributacao e a aliquota do ISS.',
      'incomplete_nfse_config',
      'enabled',
    );
  }

  return {
    serviceCode,
    serviceListItem,
    cnaeCode,
    issRate,
    issRetained,
    specialRegime,
    municipalIncidenceIbge,
    defaultServiceDescription,
    enabled,
  };
}

export async function saveTenantNfseConfig(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = validatePayload(body);
  const row = await upsertTenantNfseConfig(payload, auth?.tenantId, auth?.userId);
  return mapTenantNfseConfigRow(row);
}
