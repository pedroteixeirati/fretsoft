import { createCrudApi } from '../../../shared/lib/api-client';
import { Provider } from '../types/provider.types';

export const providersApi = createCrudApi<Provider>('/api/providers');
