import type { ResourceConfig } from '../../shared/resources/resources';

export const expensesResource: ResourceConfig = {
  table: 'expenses',
  orderBy: 'date desc, time desc',
  permissions: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
    create: ['dev', 'owner', 'admin', 'financial'],
    update: ['dev', 'owner', 'admin', 'financial'],
    delete: ['dev', 'owner', 'admin', 'financial'],
  },
  fields: [
    { api: 'date', db: 'date' },
    { api: 'time', db: 'time' },
    { api: 'vehicleId', db: 'vehicle_id' },
    { api: 'vehicleName', db: 'vehicle_name' },
    { api: 'provider', db: 'provider' },
    { api: 'category', db: 'category' },
    { api: 'quantity', db: 'quantity', type: 'number' },
    { api: 'amount', db: 'amount', type: 'number' },
    { api: 'odometer', db: 'odometer' },
    { api: 'status', db: 'status' },
    { api: 'observations', db: 'observations' },
  ],
};
