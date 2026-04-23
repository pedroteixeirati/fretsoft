export type NovalogEntryMode = 'standard' | 'batch';

export interface NovalogKpi {
  label: string;
  value: string;
  helperText: string;
}

export interface NovalogWeekOption {
  id: number;
  label: string;
  helperText: string;
}

export interface NovalogEntry {
  id: string;
  displayId?: number;
  referenceMonth?: string;
  weekNumber: number;
  operationDate: string;
  originName: string;
  destinationName: string;
  weight: number;
  companyRatePerTon: number;
  companyGrossAmount: number;
  aggregatedRatePerTon: number;
  aggregatedGrossAmount: number;
  ticketNumber: string;
  fuelStationName: string;
  entryMode: NovalogEntryMode;
  batchKey?: string;
}

export interface NovalogOption {
  value: string;
  label: string;
}

export interface NovalogStandardEntryFormData {
  operationDate: string;
  originName: string;
  destinationName: string;
  weight: string;
  companyRatePerTon: string;
  aggregatedRatePerTon: string;
  ticketNumber: string;
  fuelStationName: string;
}

export type NovalogStandardEntryField =
  | 'operationDate'
  | 'originName'
  | 'destinationName'
  | 'weight'
  | 'companyRatePerTon'
  | 'aggregatedRatePerTon'
  | 'ticketNumber'
  | 'fuelStationName';

export interface NovalogBatchEntryRow {
  id: string;
  destinationName: string;
  weight: string;
  companyRatePerTon: string;
  aggregatedRatePerTon: string;
  ticketNumber: string;
}
