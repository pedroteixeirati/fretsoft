import { UserProfile } from '../shared/types/common.types';

export type FeatureKey = 'fiscal' | 'fiscal.cte' | 'fiscal.mdfe' | 'fiscal.third_party' | 'fiscal.nfe_inbox';

export function hasFeature(profile: UserProfile | null, key: FeatureKey) {
  return !!profile?.features?.[key];
}

export function canAccessFiscal(profile: UserProfile | null) {
  return hasFeature(profile, 'fiscal');
}

// Caixa de entrada de NF-e -> conta a pagar (destino generico, sem CT-e).
// Disponivel para quem tem a flag dedicada ou o modulo fiscal completo.
export function canAccessNfeInbox(profile: UserProfile | null) {
  return hasFeature(profile, 'fiscal.nfe_inbox') || canAccessFiscal(profile);
}

export function canUseFiscalMdfe(profile: UserProfile | null) {
  return canAccessFiscal(profile) && hasFeature(profile, 'fiscal.mdfe');
}

export function canUseFiscalThirdParty(profile: UserProfile | null) {
  return canAccessFiscal(profile) && hasFeature(profile, 'fiscal.third_party');
}
