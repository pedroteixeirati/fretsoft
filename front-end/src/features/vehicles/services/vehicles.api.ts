import { createCrudApi } from '../../../shared/lib/api-client';
import { Vehicle } from '../types/vehicle.types';

export const vehiclesApi = createCrudApi<Vehicle>('/api/vehicles');
