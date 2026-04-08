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

  it('nega relatorios para perfil viewer', () => {
    expect(canAccess(makeProfile('viewer'), 'reports', 'read')).toBe(false);
  });

  it('permite plataforma apenas para dev', () => {
    expect(canAccess(makeProfile('dev'), 'platformTenants', 'read')).toBe(true);
    expect(canAccess(makeProfile('admin'), 'platformTenants', 'read')).toBe(false);
  });
});
