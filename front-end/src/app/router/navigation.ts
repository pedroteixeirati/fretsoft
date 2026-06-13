import { NavItem, UserProfile } from '../../shared/types/common.types';
import { canAccess, type Section } from '../../lib/permissions';
import { canAccessFiscal, canAccessNfeInbox, canAccessNfse, canAccessPassengerOps, canUseFiscalThirdParty } from '../../lib/features';
import { canAccessNovalogOperations } from '../../features/novalog/utils/novalog.visibility';

export const navItemToPath: Record<NavItem, string> = {
  dashboard: '/',
  platformTenants: '/transportadoras',
  tenantProfile: '/transportadora',
  revenues: '/contas-a-receber',
  payables: '/contas-a-pagar',
  recurringPayables: '/despesas-recorrentes',
  nfeInbox: '/nfe-entrada',
  nfse: '/nfse',
  fiscal: '/fiscal',
  expenses: '/custos-operacionais',
  fuelAnalysis: '/consumo-combustivel',
  serviceOrders: '/ordens-de-servico',
  maintenanceInspections: '/manutencao-preventiva',
  inventory: '/almoxarifado',
  vehicles: '/veiculos',
  vehicleDocuments: '/vencimentos-frota',
  drivers: '/motoristas',
  transportLines: '/escala',
  suppliers: '/fornecedores',
  companies: '/empresas',
  contracts: '/contratos',
  transportPartners: '/transportadores-autonomos',
  freights: '/fretes',
  novalogOperations: '/novalog/lancamentos',
  novalogBillings: '/novalog/faturamentos',
  novalogReports: '/novalog/relatorios',
  cargas: '/cargas',
  reports: '/relatorios',
  nfseConfig: '/configuracao-nfse',
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
  if (canAccess(profile, 'fiscal', 'read') && canAccessFiscal(profile)) return 'fiscal';
  if (canAccessNovalogOperations(profile)) return 'novalogOperations';
  if (canAccessNovalogOperations(profile)) return 'novalogBillings';
  if (canAccessNovalogOperations(profile)) return 'novalogReports';
  if (canAccess(profile, 'cargas', 'read')) return 'cargas';
  if (canAccess(profile, 'contracts', 'read')) return 'contracts';
  if (canAccess(profile, 'transportPartners', 'read') && canUseFiscalThirdParty(profile)) return 'transportPartners';
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
    case 'reports':
      return activeTab;
    case 'fiscal':
      return canAccess(profile, 'fiscal', 'read') && canAccessFiscal(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'transportPartners':
      return canAccess(profile, 'transportPartners', 'read') && canUseFiscalThirdParty(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'expenses':
      return canAccess(profile, 'expenses', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'fuelAnalysis':
      return canAccess(profile, 'expenses', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'serviceOrders':
      return canAccess(profile, 'serviceOrders', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'maintenanceInspections':
      return canAccess(profile, 'maintenanceInspections', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'inventory':
      return canAccess(profile, 'inventory', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'vehicles':
      return canAccess(profile, 'vehicles', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'vehicleDocuments':
      return canAccess(profile, 'vehicleDocuments', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'drivers':
      return canAccessPassengerOps(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'transportLines':
      return canAccessPassengerOps(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'recurringPayables':
      return canAccess(profile, 'recurringPayables', 'read') ? activeTab : getFirstAllowedTab(profile);
    case 'nfeInbox':
      return canAccessNfeInbox(profile) ? activeTab : getFirstAllowedTab(profile);
    case 'nfse':
      return canAccessNfse(profile) ? activeTab : getFirstAllowedTab(profile);
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
    case 'nfseConfig':
      return canAccessNfse(profile) ? activeTab : getFirstAllowedTab(profile);
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
  recurringPayables: 'recurringPayables',
  nfeInbox: 'payables',
  nfse: 'revenues',
  fiscal: 'fiscal',
  expenses: 'expenses',
  fuelAnalysis: 'expenses',
  serviceOrders: 'serviceOrders',
  maintenanceInspections: 'maintenanceInspections',
  inventory: 'inventory',
  vehicles: 'vehicles',
  vehicleDocuments: 'vehicleDocuments',
  drivers: 'drivers',
  transportLines: 'transportLines',
  suppliers: 'providers',
  companies: 'companies',
  contracts: 'contracts',
  transportPartners: 'transportPartners',
  freights: 'freights',
  novalogOperations: 'freights',
  novalogBillings: 'revenues',
  novalogReports: 'reports',
  cargas: 'cargas',
  reports: 'reports',
  nfseConfig: 'settings',
  settings: 'settings',
};
