export type ContractInput = {
  companyId: string;
  contractName: string;
  remunerationType: 'recurring' | 'per_trip';
  annualValue?: number | string;
  monthlyValue?: number | string;
  startDate: string;
  endDate: string;
  status: 'active' | 'renewal' | 'closed';
  vehicleIds: string[];
  notes?: string;
};

export type ContractPayload = {
  displayId?: number;
  companyId: string;
  companyName: string;
  contractName: string;
  remunerationType: 'recurring' | 'per_trip';
  annualValue: number;
  monthlyValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'renewal' | 'closed';
  vehicleIds: string[];
  vehicleNames: string[];
  notes: string;
};
