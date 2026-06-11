import { canAccessFiscal, canUseFiscalMdfe, canUseFiscalThirdParty, hasFeature } from './features';
import { UserProfile } from '../shared/types/common.types';

function makeProfile(features?: Record<string, boolean>): UserProfile {
  return {
    uid: 'user-1',
    email: 'user@teste.com',
    role: 'admin',
    tenantId: 'tenant-1',
    tenantName: 'Tenant Teste',
    tenantSlug: 'tenant-teste',
    features,
  };
}

describe('feature flags fiscais', () => {
  it('canAccessFiscal exige a flag mestre', () => {
    expect(canAccessFiscal(null)).toBe(false);
    expect(canAccessFiscal(makeProfile())).toBe(false);
    expect(canAccessFiscal(makeProfile({ fiscal: false }))).toBe(false);
    expect(canAccessFiscal(makeProfile({ fiscal: true }))).toBe(true);
  });

  it('sub-flags dependem da flag mestre', () => {
    expect(canUseFiscalMdfe(makeProfile({ 'fiscal.mdfe': true }))).toBe(false);
    expect(canUseFiscalMdfe(makeProfile({ fiscal: true, 'fiscal.mdfe': true }))).toBe(true);
    expect(canUseFiscalThirdParty(makeProfile({ fiscal: true }))).toBe(false);
    expect(canUseFiscalThirdParty(makeProfile({ fiscal: true, 'fiscal.third_party': true }))).toBe(true);
  });

  it('hasFeature retorna false para flag ausente', () => {
    expect(hasFeature(makeProfile({ fiscal: true }), 'fiscal.cte')).toBe(false);
    expect(hasFeature(makeProfile({ 'fiscal.cte': true }), 'fiscal.cte')).toBe(true);
  });
});
