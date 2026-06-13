export type FeatureMap = Record<string, boolean>;

export const FISCAL_FEATURE_KEYS = [
  'fiscal',
  'fiscal.cte',
  'fiscal.mdfe',
  'fiscal.third_party',
  'fiscal.nfe_inbox',
  'fiscal.nfse',
] as const;

export type FiscalFeatureKey = (typeof FISCAL_FEATURE_KEYS)[number];

// Flags de segmento/plataforma (nao-fiscais), tambem geridas por tenant.
export const PLATFORM_FEATURE_KEYS = [
  'passenger_ops',
] as const;

export type PlatformFeatureKey = (typeof PLATFORM_FEATURE_KEYS)[number];

// Todas as flags que o dev pode gerenciar por tenant.
export const MANAGED_FEATURE_KEYS = [...FISCAL_FEATURE_KEYS, ...PLATFORM_FEATURE_KEYS] as const;

export function isFeatureEnabled(features: FeatureMap | undefined, key: string) {
  return !!features && features[key] === true;
}
