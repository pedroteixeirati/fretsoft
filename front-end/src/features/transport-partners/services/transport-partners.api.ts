import { createCrudApi } from '../../../shared/lib/api-client';
import { TransportPartner } from '../types/transport-partner.types';

export const transportPartnersApi = createCrudApi<TransportPartner>('/api/transport-partners');
