export type NovalogEntryMode = 'standard' | 'batch';

export type NovalogEntryInput = {
  weekNumber?: number | string;
  operationDate?: string;
  originName?: string;
  destinationName?: string;
  weight?: number | string;
  companyRatePerTon?: number | string;
  aggregatedRatePerTon?: number | string;
  ticketNumber?: string;
  fuelStationName?: string;
  driverName?: string;
  vehicleLabel?: string;
  notes?: string;
  entryMode?: NovalogEntryMode | string;
  batchKey?: string;
};

export type NovalogBatchInput = {
  weekNumber?: number | string;
  operationDate?: string;
  originName?: string;
  entries?: NovalogEntryInput[];
};

export type NovalogEntriesFilters = {
  referenceMonth?: string;
};

export type NovalogEntryPayload = {
  referenceMonth: string;
  weekNumber: number;
  operationDate: string;
  originName: string;
  destinationName: string;
  weight: number;
  companyRatePerTon: number;
  companyGrossAmount: number;
  aggregatedRatePerTon: number;
  aggregatedGrossAmount: number;
  ticketNumber: string | null;
  fuelStationName: string | null;
  driverName: string | null;
  vehicleLabel: string | null;
  driverSharePercent: number;
  driverShareAmount: number;
  driverNetAmount: number;
  notes: string | null;
  entryMode: NovalogEntryMode;
  batchKey: string | null;
};
