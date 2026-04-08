import { UserProfile } from '../shared/types/common.types';

export type Role = UserProfile['role'];
export type Section = 'platformTenants' | 'tenantProfile' | 'revenues' | 'payables' | 'vehicles' | 'providers' | 'companies' | 'contracts' | 'freights' | 'expenses' | 'reports' | 'settings' | 'users';
export type Action = 'read' | 'create' | 'update' | 'delete';

const sectionPermissions: Record<Section, Record<Action, Role[]>> = {
  platformTenants: {
    read: ['dev'],
    create: ['dev'],
    update: ['dev'],
    delete: [],
  },
  tenantProfile: {
    read: ['dev', 'owner', 'admin'],
    create: [],
    update: ['dev', 'owner', 'admin'],
    delete: [],
  },
  revenues: {
    read: ['dev', 'owner', 'admin', 'financial'],
    create: ['dev', 'owner', 'admin', 'financial'],
    update: [],
    delete: [],
  },
  payables: {
    read: ['dev', 'owner', 'admin', 'financial'],
    create: ['dev', 'owner', 'admin', 'financial'],
    update: ['dev', 'owner', 'admin', 'financial'],
    delete: ['dev', 'owner', 'admin', 'financial'],
  },
  vehicles: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational'],
    update: ['dev', 'owner', 'admin', 'operational'],
    delete: ['dev', 'owner', 'admin', 'operational'],
  },
  providers: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational'],
    update: ['dev', 'owner', 'admin', 'operational'],
    delete: ['dev', 'owner', 'admin', 'operational'],
  },
  companies: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational'],
    update: ['dev', 'owner', 'admin', 'operational'],
    delete: ['dev', 'owner', 'admin', 'operational'],
  },
  contracts: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational'],
    update: ['dev', 'owner', 'admin', 'operational'],
    delete: ['dev', 'owner', 'admin'],
  },
  freights: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational', 'driver'],
    update: ['dev', 'owner', 'admin', 'operational', 'driver'],
    delete: ['dev', 'owner', 'admin', 'operational'],
  },
  expenses: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational'],
    update: ['dev', 'owner', 'admin', 'operational'],
    delete: ['dev', 'owner', 'admin', 'operational'],
  },
  reports: {
    read: ['dev', 'owner', 'admin', 'financial'],
    create: [],
    update: [],
    delete: [],
  },
  settings: {
    read: ['dev', 'owner', 'admin'],
    create: [],
    update: [],
    delete: [],
  },
  users: {
    read: ['dev', 'owner'],
    create: ['dev', 'owner'],
    update: ['dev', 'owner'],
    delete: [],
  },
};

export function canAccess(profile: UserProfile | null, section: Section, action: Action) {
  if (!profile) return false;
  return sectionPermissions[section][action].includes(profile.role);
}
