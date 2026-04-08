import { getFirstAllowedPath, getNavItemFromPath, getPathFromNavItem, resolveAllowedTab } from './navigation';
import { UserProfile } from '../../shared/types/common.types';

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

describe('router navigation helpers', () => {
  it('resolve item a partir do caminho', () => {
    expect(getNavItemFromPath('/contas-a-pagar')).toBe('payables');
    expect(getNavItemFromPath('/fretes/123')).toBe('freights');
    expect(getNavItemFromPath('/rota-inexistente')).toBe('dashboard');
  });

  it('resolve caminho a partir do item', () => {
    expect(getPathFromNavItem('reports')).toBe('/relatorios');
  });

  it('retorna a primeira rota permitida para perfil financeiro', () => {
    expect(getFirstAllowedPath(makeProfile('financial'))).toBe('/veiculos');
  });

  it('redireciona aba proibida para a primeira permitida', () => {
    expect(resolveAllowedTab(makeProfile('viewer'), 'reports')).toBe('vehicles');
  });
});
