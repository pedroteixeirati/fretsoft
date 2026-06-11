import { UserProfile } from '../shared/types/common.types';

export type FeatureKey = 'fiscal' | 'fiscal.cte' | 'fiscal.mdfe' | 'fiscal.third_party';

export function hasFeature(profile: UserProfile | null, key: FeatureKey) {
  return !!profile?.features?.[key];
}

export function canAccessFiscal(profile: UserProfile | null) {
  return hasFeature(profile, 'fiscal');
}

export function canUseFiscalMdfe(profile: UserProfile | null) {
  return canAccessFiscal(profile) && hasFeature(profile, 'fiscal.mdfe');
}

export function canUseFiscalThirdParty(profile: UserProfile | null) {
  return canAccessFiscal(profile) && hasFeature(profile, 'fiscal.third_party');
}
