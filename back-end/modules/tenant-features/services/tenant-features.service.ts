import { FISCAL_FEATURE_KEYS } from '../../../shared/authorization/features';
import { forbiddenError, validationError } from '../../../shared/errors/app-error';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { listTenantFeatureRows, upsertTenantFeature } from '../repositories/tenant-features.repository';

const FEATURE_LABELS: Record<string, string> = {
  fiscal: 'Modulo fiscal (mestre)',
  'fiscal.cte': 'Emissao de CT-e',
  'fiscal.mdfe': 'Emissao de MDF-e',
  'fiscal.third_party': 'Frete de terceiro (TAC / CIOT)',
};

function ensureDev(auth?: AuthContext) {
  if (auth?.role !== 'dev') {
    throw forbiddenError('Apenas o perfil dev pode gerenciar feature flags.', 'feature_admin_forbidden');
  }
}

export async function listTenantFeatures(auth?: AuthContext) {
  ensureDev(auth);
  const rows = await listTenantFeatureRows(auth?.tenantId || '');
  const enabled = new Map(rows.map((row) => [row.feature_key, row.enabled]));
  return FISCAL_FEATURE_KEYS.map((key) => ({
    key,
    label: FEATURE_LABELS[key] || key,
    enabled: enabled.get(key) === true,
  }));
}

export async function setTenantFeature(auth: AuthContext | undefined, key: string, enabled: boolean) {
  ensureDev(auth);
  if (!FISCAL_FEATURE_KEYS.includes(key as (typeof FISCAL_FEATURE_KEYS)[number])) {
    throw validationError('Feature flag invalida.', 'invalid_feature_key', 'key');
  }
  await upsertTenantFeature(auth?.tenantId || '', key, enabled === true, auth?.userId);
  return listTenantFeatures(auth);
}
