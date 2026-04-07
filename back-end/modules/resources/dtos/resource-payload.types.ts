import type { ContractPayload } from '../../contracts/dtos/contract.types';
import type { ExpensePayload } from '../../expenses/dtos/expense.types';
import type { FreightPayload } from '../../freights/dtos/freight.types';

export type VehiclePayload = {
  name: string;
  plate: string;
  driver: string;
  type: string;
  km: number;
  nextMaintenance: string;
  status: string;
};

export type ProviderPayload = {
  name: string;
  type: string;
  status: string;
  contact: string;
  email: string;
  address: string;
};

export type CompanyPayload = {
  corporateName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  municipalRegistration: string;
  legalRepresentative: string;
  representativeCpf: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contractContact: string;
  notes: string;
  status: string;
};

export type ResourcePayload =
  | VehiclePayload
  | ProviderPayload
  | CompanyPayload
  | ContractPayload
  | FreightPayload
  | ExpensePayload
  | Record<string, unknown>;
