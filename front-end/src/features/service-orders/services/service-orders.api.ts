import { createCrudApi } from '../../../shared/lib/api-client';
import { ServiceOrder } from '../types/service-order.types';

export const serviceOrdersApi = createCrudApi<ServiceOrder>('/api/service-orders');
