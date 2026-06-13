import { createCrudApi } from '../../../shared/lib/api-client';
import { Driver } from '../types/driver.types';

export const driversApi = createCrudApi<Driver>('/api/drivers');
