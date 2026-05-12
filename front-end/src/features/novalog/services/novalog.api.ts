import { apiRequest, createCrudApi } from '../../../shared/lib/api-client';
import { NovalogEntry } from '../types/novalog.types';

export interface NovalogBatchCreatePayload {
  weekNumber: number;
  operationDate: string;
  originName: string;
  entries: Array<{
    destinationName: string;
    weight: number;
    companyRatePerTon: number;
    aggregatedRatePerTon: number;
    ticketNumber?: string;
    fuelStationName?: string;
  }>;
}

const crudApi = createCrudApi<NovalogEntry>('/api/novalog/entries');

export interface NovalogEntriesFilters {
  referenceMonth?: string;
}

function buildEntriesPath(filters: NovalogEntriesFilters = {}) {
  const params = new URLSearchParams();

  if (filters.referenceMonth) {
    params.set('referenceMonth', filters.referenceMonth);
  }

  const query = params.toString();
  return `/api/novalog/entries${query ? `?${query}` : ''}`;
}

export const novalogApi = {
  ...crudApi,
  list: (filters?: NovalogEntriesFilters) => apiRequest<NovalogEntry[]>(buildEntriesPath(filters)),
  listReferenceMonths: () => apiRequest<string[]>('/api/novalog/entries/reference-months'),
  createBatch: (payload: NovalogBatchCreatePayload) =>
    apiRequest<NovalogEntry[]>(
      '/api/novalog/entries/batch',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    ),
};
