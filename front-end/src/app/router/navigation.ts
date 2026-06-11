import { NavItem, UserProfile } from '../../shared/types/common.types';
import { canAccess, type Section } from '../../lib/permissions';
import { canAccessNovalogOperations } from '../../features/novalog/utils/novalog.visibility';

export const navItemToPath: Record<NavItem, string> = {
  dashboard: '/',
  platformTenants: '/transportadoras',
  tenantProfile: '/transportadora',
  revenues: '/contas-a-receber',
  payables: '/contas-a-pagar',
  fiscal: '/fiscal',
  expenses: '/custos-operacionais',
  vehicles: '/veiculos',
  suppliers: '/fornecedores',
  companies: '/empresas',
  contracts: '/contratos',
  freights: '/fretes',
  novalogOperations: '/novalog/lancamentos',
  novalogBillings: '/novalog/faturamentos',
  novalogReports: '/novalog/relatorios',
  cargas: '/cargas',
  reports: '/relatorios',
  settings: '/configuracoes',
  support: '/suporte',
};

const pathToNavItemEntries = Object.entries(navItemToPath) as Array<[NavItem, string]>;

export function getNavItemFromPath(pathname: string): NavItem {
  const exactMatch = pathToNavItemEntries.find(([, path]) => path === pathname)?.[0];
  if (exactMatch) return exactMatch;

  const partialMatch = pathToNavItemEntries.find(([, path]) => path !== '/' && pathname.startsWith(path))?.[0];
  return partialMatch ?? 'dashboard';
}

export function getPathFromNavItem(item: NavItem): string {
  return navItemToPath[item] ?? '/';
}

export function getFirstAllowedTab(profile: UserProfile): NavItem {
  if (canAccess(profile, 'platformTenants', 'read')) return 'platformTenants';
  if (canAccess(profile, 'vehicles', 'read')) return 'vehicles';
  if (canAccess(profile, 'providers', 'read')) return 'suppliers';
  if (canAccess(profile, 'companies', 'read')) return 'companies';
  if (canAccess(profile, 'freights', 'read')) return 'freights';
  if (canAccess(profile, 'fiscal', 'read')) return 'fiscal';
  if (canAccessNovalogOperations(profile)) return 'novalogOperations';
  if (canAccessNovalogOperations(profile)) return 'novalogBillings';
  if (canAccessNovalogOperations(profile)) return 'novalogReports';
  if (canAccess(profile, 'cargas', 'read')) return 'cargas';
  if (canAccess(profile, 'contracts', 'read')) return 'contracts';
  if (canAccess(profile, 'expenses', 'read')) return 'expenses';
  if (canAccess(profile, 'tenantProfile', 'read')) return 'tenantProfile';
  if (canAccess(profile, 'settings', 'read')) return 'settings';
  return 'revenues';
}

export function resolveAllowedTab(profile: UserProfile, activeTab: NavItem): NavItem {
  switch (activeTab) {
    case 'platformTenants':
      return canAccess(profile, 'platformTenants', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'tenantProfile':
      return canAccess(profile, 'tenantProfile', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'revenues':
    case 'payables':
    case 'fiscal':
    case 'reports':
      return activeTab;
    case 'expenses':
      return canAccess(profile, 'expenses', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'vehicles':
      return canAccess(profile, 'vehicles', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'suppliers':
      return canAccess(profile, 'providers', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'companies':
      return canAccess(profile, 'companies', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'contracts':
      return canAccess(profile, 'contracts', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'freights':
      return canAccess(profile, 'freights', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'novalogOperations':
      return canAccessNovalogOperations(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'novalogBillings':
      return canAccessNovalogOperations(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'novalogReports':
      return canAccessNovalogOperations(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'cargas':
      return canAccess(profile, 'cargas', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'settings':
      return canAccess(profile, 'settings', 'read') ? activeTab : getFirstAllowedTab(profile);
    default:
      return activeTab;
  }
}

export function getFirstAllowedPath(profile: UserProfile): string {
  return getPathFromNavItem(getFirstAllowedTab(profile));
}

export const navItemSectionMap: Partial<Record<NavItem, Section>> = {
  platformTenants: 'platformTenants',
  tenantProfile: 'tenantProfile',
  revenues: 'revenues',
  payables: 'payables',
  fiscal: 'fiscal',
  expenses: 'expenses',
  vehicles: 'vehicles',
  suppliers: 'providers',
  companies: 'companies',
  contracts: 'contracts',
  freights: 'freights',
  novalogOperations: 'freights',
  novalogBillings: 'revenues',
  novalogReports: 'reports',
  cargas: 'cargas',
  reports: 'reports',
  settings: 'settings',
};
