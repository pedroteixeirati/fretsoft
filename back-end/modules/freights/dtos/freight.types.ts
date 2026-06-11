export type FreightExecutionMode = 'own_fleet' | 'third_party';

export type FreightInput = {
  vehicleId: string;
  contractId?: string | null;
  date: string;
  origin: string;
  destination: string;
  amount?: number | string | null;
  hasCargo?: boolean | 'true' | 'false';
  executionMode?: FreightExecutionMode | string | null;
  transportPartnerId?: string | null;
};

export type FreightPayload = {
  displayId?: number;
  vehicleId: string;
  plate: string;
  contractId: string | null;
  contractName: string;
  billingType: 'standalone' | 'contract_recurring' | 'contract_per_trip';
  date: string;
  origin: string;
  destination: string;
  amount: number;
  hasCargo: boolean;
  executionMode: FreightExecutionMode;
  transportPartnerId: string | null;
};
