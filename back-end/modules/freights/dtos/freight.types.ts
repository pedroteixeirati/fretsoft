export type FreightInput = {
  vehicleId: string;
  contractId?: string | null;
  date: string;
  route: string;
  amount?: number | string | null;
  hasCargo?: boolean | 'true' | 'false';
};

export type FreightPayload = {
  displayId?: number;
  vehicleId: string;
  plate: string;
  contractId: string | null;
  contractName: string;
  billingType: 'standalone' | 'contract_recurring' | 'contract_per_trip';
  date: string;
  route: string;
  amount: number;
  hasCargo: boolean;
};
