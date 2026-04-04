export type NavItem = 'dashboard' | 'platformTenants' | 'tenantProfile' | 'expenses' | 'vehicles' | 'suppliers' | 'companies' | 'contracts' | 'freights' | 'reports' | 'settings' | 'support';

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  driver: string;
  type: string;
  km: number;
  nextMaintenance: string;
  status: 'active' | 'maintenance' | 'alert';
  efficiency?: number;
  fuelType?: string;
  license?: string;
  healthScore?: number;
  image?: string;
}

export interface Expense {
  id: string;
  date: string;
  time: string;
  vehicleId: string;
  vehicleName: string;
  provider: string;
  category: string;
  quantity: string;
  amount: number;
  odometer: string;
  status: 'approved' | 'review' | 'pending';
  observations: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  rating: number;
  status: string;
  contact: string;
  email: string;
  address: string;
}

export interface Company {
  id: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  municipalRegistration: string;
  legalRepresentative: string;
  representativeCpf: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contractContact?: string;
  notes?: string;
  status: 'active' | 'inactive';
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'dev' | 'owner' | 'admin' | 'financial' | 'operational' | 'driver' | 'viewer';
  name?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

export interface TenantProfile {
  id: string;
  name: string;
  tradeName: string;
  slug: string;
  cnpj: string;
  stateRegistration: string;
  municipalRegistration: string;
  taxRegime: string;
  mainCnae: string;
  secondaryCnaes: string;
  openedAt: string;
  legalRepresentative: string;
  phone: string;
  whatsapp: string;
  email: string;
  financialEmail: string;
  fiscalEmail: string;
  website: string;
  zipCode: string;
  ibgeCode: string;
  addressLine: string;
  addressNumber: string;
  addressComplement: string;
  district: string;
  city: string;
  state: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface PlatformTenant {
  id: string;
  name: string;
  tradeName: string;
  slug: string;
  cnpj: string;
  city: string;
  state: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  ownerName: string;
  ownerEmail: string;
  ownerLinked: boolean;
  createdAt: string;
}

export interface Contract {
  id: string;
  companyId?: string;
  companyName: string;
  contractName: string;
  annualValue: number;
  monthlyValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'renewal' | 'closed';
  vehicleIds: string[];
  vehicleNames: string[];
  notes?: string;
}

export interface Freight {
  id: string;
  vehicleId: string;
  plate: string;
  date: string;
  route: string;
  amount: number;
}
