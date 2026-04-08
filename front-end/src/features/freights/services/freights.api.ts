import { createCrudApi } from '../../../shared/lib/api-client';
import { Freight } from '../types/freight.types';

export const freightsApi = createCrudApi<Freight>('/api/freights');
