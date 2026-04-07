import type { ResourcePermissions } from '../authorization/permissions.ts';

type FieldMap = {
  api: string;
  db: string;
  type?: 'number';
};

export type ResourceConfig = {
  table: string;
  orderBy: string;
  fields: FieldMap[];
  permissions: ResourcePermissions;
};

export const resources: Record<string, ResourceConfig> = {
  vehicles: {
    table: 'vehicles',
    orderBy: 'created_at desc',
    permissions: {
      read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
      create: ['dev', 'owner', 'admin', 'operational'],
      update: ['dev', 'owner', 'admin', 'operational'],
      delete: ['dev', 'owner', 'admin', 'operational'],
    },
    fields: [
      { api: 'name', db: 'name' },
      { api: 'plate', db: 'plate' },
      { api: 'driver', db: 'driver' },
      { api: 'type', db: 'type' },
      { api: 'km', db: 'km', type: 'number' },
      { api: 'nextMaintenance', db: 'next_maintenance' },
      { api: 'status', db: 'status' },
    ],
  },
  providers: {
    table: 'providers',
    orderBy: 'created_at desc',
    permissions: {
      read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
      create: ['dev', 'owner', 'admin', 'operational'],
      update: ['dev', 'owner', 'admin', 'operational'],
      delete: ['dev', 'owner', 'admin', 'operational'],
    },
    fields: [
      { api: 'name', db: 'name' },
      { api: 'type', db: 'type' },
      { api: 'status', db: 'status' },
      { api: 'contact', db: 'contact' },
      { api: 'email', db: 'email' },
      { api: 'address', db: 'address' },
    ],
  },
  companies: {
    table: 'companies',
    orderBy: 'created_at desc',
    permissions: {
      read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
      create: ['dev', 'owner', 'admin', 'operational'],
      update: ['dev', 'owner', 'admin', 'operational'],
      delete: ['dev', 'owner', 'admin', 'operational'],
    },
    fields: [
      { api: 'corporateName', db: 'corporate_name' },
      { api: 'tradeName', db: 'trade_name' },
      { api: 'cnpj', db: 'cnpj' },
      { api: 'stateRegistration', db: 'state_registration' },
      { api: 'municipalRegistration', db: 'municipal_registration' },
      { api: 'legalRepresentative', db: 'legal_representative' },
      { api: 'representativeCpf', db: 'representative_cpf' },
      { api: 'email', db: 'email' },
      { api: 'phone', db: 'phone' },
      { api: 'address', db: 'address' },
      { api: 'city', db: 'city' },
      { api: 'state', db: 'state' },
      { api: 'zipCode', db: 'zip_code' },
      { api: 'contractContact', db: 'contract_contact' },
      { api: 'notes', db: 'notes' },
      { api: 'status', db: 'status' },
    ],
  },
};
