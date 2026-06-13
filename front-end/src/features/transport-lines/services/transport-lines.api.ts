import { createCrudApi } from '../../../shared/lib/api-client';
import { TransportLine } from '../types/transport-line.types';

export const transportLinesApi = createCrudApi<TransportLine>('/api/transport-lines');
