import { createCrudApi } from '../../../shared/lib/api-client';
import { Contract } from '../types/contract.types';

export const contractsApi = createCrudApi<Contract>('/api/contracts');
