import type { ResourceConfig } from '../../shared/resources/resources.ts';

export const cargasResource: ResourceConfig = {
  table: 'cargas',
  orderBy: 'created_at desc',
  permissions: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational'],
    update: ['dev', 'owner', 'admin', 'operational'],
    delete: ['dev', 'owner', 'admin', 'operational'],
  },
  fields: [
    { api: 'freightId', db: 'freight_id' },
    { api: 'freightDisplayId', db: 'freight_display_id', type: 'number' },
    { api: 'freightRoute', db: 'freight_route' },
    { api: 'companyId', db: 'company_id' },
    { api: 'companyName', db: 'company_name' },
    { api: 'cargoNumber', db: 'cargo_number' },
    { api: 'description', db: 'description' },
    { api: 'cargoType', db: 'cargo_type' },
    { api: 'weight', db: 'weight', type: 'number' },
    { api: 'volume', db: 'volume', type: 'number' },
    { api: 'unitCount', db: 'unit_count', type: 'number' },
    { api: 'merchandiseValue', db: 'merchandise_value', type: 'number' },
    { api: 'origin', db: 'origin' },
    { api: 'destination', db: 'destination' },
    { api: 'status', db: 'status' },
    { api: 'scheduledDate', db: 'scheduled_date' },
    { api: 'deliveredAt', db: 'delivered_at' },
    { api: 'notes', db: 'notes' },
  ],
};
