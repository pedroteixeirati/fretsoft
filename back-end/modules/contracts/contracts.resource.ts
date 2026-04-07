import type { ResourceConfig } from '../../shared/resources/resources';

export const contractsResource: ResourceConfig = {
  table: 'contracts',
  orderBy: 'created_at desc',
  permissions: {
    read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
    create: ['dev', 'owner', 'admin', 'operational'],
    update: ['dev', 'owner', 'admin', 'operational'],
    delete: ['dev', 'owner', 'admin'],
  },
  fields: [
    { api: 'companyId', db: 'company_id' },
    { api: 'companyName', db: 'company_name' },
    { api: 'contractName', db: 'contract_name' },
    { api: 'remunerationType', db: 'remuneration_type' },
    { api: 'annualValue', db: 'annual_value', type: 'number' },
    { api: 'monthlyValue', db: 'monthly_value', type: 'number' },
    { api: 'startDate', db: 'start_date' },
    { api: 'endDate', db: 'end_date' },
    { api: 'status', db: 'status' },
    { api: 'vehicleIds', db: 'vehicle_ids' },
    { api: 'vehicleNames', db: 'vehicle_names' },
    { api: 'notes', db: 'notes' },
  ],
};
