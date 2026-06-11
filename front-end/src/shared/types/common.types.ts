export type NavItem =
  | 'dashboard'
  | 'platformTenants'
  | 'tenantProfile'
  | 'revenues'
  | 'payables'
  | 'fiscal'
  | 'expenses'
  | 'vehicles'
  | 'suppliers'
  | 'companies'
  | 'contracts'
  | 'freights'
  | 'novalogOperations'
  | 'novalogBillings'
  | 'novalogReports'
  | 'cargas'
  | 'reports'
  | 'settings'
  | 'support';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'dev' | 'owner' | 'admin' | 'financial' | 'operational' | 'driver' | 'viewer';
  name?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantLogoUrl?: string;
}
