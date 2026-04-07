export type NavItem = 'dashboard' | 'platformTenants' | 'tenantProfile' | 'revenues' | 'expenses' | 'vehicles' | 'suppliers' | 'companies' | 'contracts' | 'freights' | 'reports' | 'settings' | 'support';

export interface Vehicle {
  id: string;
  displayId?: number;
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
  displayId?: number;
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
  displayId?: number;
  name: string;
  type: string;
  status: string;
  contact: string;
  email: string;
  address: string;
}

export interface Company {
  id: string;
  displayId?: number;
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
  tenantLogoUrl?: string;
}

export interface TenantProfile {
  id: string;
  displayId?: number;
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
  logoUrl: string;
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
  createdAt?: string;
  updatedAt?: string;
  createdByName?: string;
  updatedByName?: string;
}

export interface PlatformTenant {
  id: string;
  displayId?: number;
  name: string;
  tradeName: string;
  slug: string;
  cnpj: string;
  city: string;
  state: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  legalRepresentative?: string;
  ownerName: string;
  ownerEmail: string;
  ownerLinked: boolean;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
  updatedByName?: string;
}

export interface Revenue {
  id: string;
  displayId?: number;
  companyId: string;
  companyName: string;
  contractId: string;
  contractName: string;
  freightId?: string;
  competenceMonth: number;
  competenceYear: number;
  competenceLabel: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'billed' | 'received' | 'overdue' | 'canceled';
  sourceType: 'contract' | 'freight' | 'manual';
  chargeReference?: string;
  chargeGeneratedAt?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  displayId?: number;
  companyId?: string;
  companyName: string;
  contractName: string;
  remunerationType: 'recurring' | 'per_trip';
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
  displayId?: number;
  vehicleId: string;
  plate: string;
  contractId?: string;
  contractName?: string;
  billingType?: 'standalone' | 'contract_recurring' | 'contract_per_trip';
  date: string;
  route: string;
  amount: number;
}
