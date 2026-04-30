import { canAccess } from './permissions';
import { UserProfile } from '../shared/types/common.types';

function makeProfile(role: UserProfile['role']): UserProfile {
  return {
    uid: `user-${role}`,
    email: `${role}@teste.com`,
    role,
    tenantId: 'tenant-1',
    tenantName: 'Tenant Teste',
    tenantSlug: 'tenant-teste',
  };
}

describe('canAccess', () => {
  it('retorna false sem perfil', () => {
    expect(canAccess(null, 'expenses', 'read')).toBe(false);
  });

  it('permite leitura de custos para perfil operacional', () => {
    expect(canAccess(makeProfile('operational'), 'expenses', 'read')).toBe(true);
  });

  it('permite leitura financeira para perfis sem acao financeira', () => {
    expect(canAccess(makeProfile('operational'), 'revenues', 'read')).toBe(true);
    expect(canAccess(makeProfile('operational'), 'payables', 'read')).toBe(true);
    expect(canAccess(makeProfile('viewer'), 'reports', 'read')).toBe(true);
    expect(canAccess(makeProfile('operational'), 'payables', 'update')).toBe(false);
  });

  it('permite plataforma apenas para dev', () => {
    expect(canAccess(makeProfile('dev'), 'platformTenants', 'read')).toBe(true);
    expect(canAccess(makeProfile('admin'), 'platformTenants', 'read')).toBe(false);
  });
});
