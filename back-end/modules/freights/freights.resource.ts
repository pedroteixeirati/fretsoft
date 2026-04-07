import type { ResourceConfig } from '../../shared/resources/resources';

export const freightsResource: ResourceConfig = {
  table: 'freights',
  orderBy: 'date desc',
  permissions: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational', 'driver'],
    update: ['dev', 'owner', 'admin', 'operational', 'driver'],
    delete: ['dev', 'owner', 'admin', 'operational'],
  },
  fields: [
    { api: 'vehicleId', db: 'vehicle_id' },
    { api: 'plate', db: 'plate' },
    { api: 'contractId', db: 'contract_id' },
    { api: 'contractName', db: 'contract_name' },
    { api: 'billingType', db: 'billing_type' },
    { api: 'date', db: 'date' },
    { api: 'route', db: 'route' },
    { api: 'amount', db: 'amount', type: 'number' },
  ],
};
