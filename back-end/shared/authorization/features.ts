export type FeatureMap = Record<string, boolean>;

export const FISCAL_FEATURE_KEYS = [
  'fiscal',
  'fiscal.cte',
  'fiscal.mdfe',
  'fiscal.third_party',
] as const;

export type FiscalFeatureKey = (typeof FISCAL_FEATURE_KEYS)[number];

export function isFeatureEnabled(features: FeatureMap | undefined, key: string) {
  return !!features && features[key] === true;
}
