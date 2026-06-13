import { createCrudApi } from '../../../shared/lib/api-client';
import { MaintenanceInspection } from '../types/maintenance-inspection.types';

export const maintenanceInspectionsApi = createCrudApi<MaintenanceInspection>('/api/maintenance-inspections');
