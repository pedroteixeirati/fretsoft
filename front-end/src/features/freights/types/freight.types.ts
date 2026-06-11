export interface Freight {
  id: string;
  displayId?: number;
  vehicleId: string;
  plate: string;
  contractId?: string;
  contractName?: string;
  billingType?: 'standalone' | 'contract_recurring' | 'contract_per_trip';
  date: string;
  origin: string;
  destination: string;
  amount: number;
  hasCargo?: boolean;
  executionMode?: 'own_fleet' | 'third_party';
  transportPartnerId?: string | null;
}
