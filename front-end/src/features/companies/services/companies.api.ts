import { createCrudApi } from '../../../shared/lib/api-client';
import { Company } from '../types/company.types';

export const companiesApi = createCrudApi<Company>('/api/companies');
