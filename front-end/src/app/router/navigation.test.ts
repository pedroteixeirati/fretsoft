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

function makeNovalogProfile(role: UserProfile['role']): UserProfile {
  return {
    ...makeProfile(role),
    tenantSlug: 'novalog',
    tenantName: 'Novalog',
  };
}

describe('router navigation helpers', () => {
  it('resolve item a partir do caminho', () => {
    expect(getNavItemFromPath('/contas-a-pagar')).toBe('payables');
    expect(getNavItemFromPath('/fretes/123')).toBe('freights');
    expect(getNavItemFromPath('/cargas/123')).toBe('cargas');
    expect(getNavItemFromPath('/rota-inexistente')).toBe('dashboard');
  });

  it('resolve caminho a partir do item', () => {
    expect(getPathFromNavItem('reports')).toBe('/relatorios');
    expect(getPathFromNavItem('cargas')).toBe('/cargas');
    expect(getPathFromNavItem('novalogReports')).toBe('/novalog/relatorios');
  });

  it('retorna a primeira rota permitida para perfil financeiro', () => {
    expect(getFirstAllowedPath(makeProfile('financial'))).toBe('/veiculos');
  });

  it('mantem abas financeiras liberadas no front para qualquer perfil', () => {
    expect(resolveAllowedTab(makeProfile('viewer'), 'revenues')).toBe('revenues');
    expect(resolveAllowedTab(makeProfile('viewer'), 'payables')).toBe('payables');
    expect(resolveAllowedTab(makeProfile('viewer'), 'reports')).toBe('reports');
  });

  it('permite resolver a rota de relatorios Novalog para o tenant especifico', () => {
    expect(resolveAllowedTab(makeNovalogProfile('financial'), 'novalogReports')).toBe('novalogReports');
  });
});
