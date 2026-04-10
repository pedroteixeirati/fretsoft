export type CargoStatus = 'planned' | 'loading' | 'in_transit' | 'delivered' | 'cancelled';

export type CargoInput = {
  freightId: string;
  companyId: string;
  cargoNumber?: string | null;
  description: string;
  cargoType: string;
  weight?: string | number | null;
  volume?: string | number | null;
  unitCount?: string | number | null;
  merchandiseValue?: string | number | null;
  origin: string;
  destination: string;
  status: CargoStatus;
  scheduledDate?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
};

export type CargoPayload = {
  displayId?: number;
  freightId: string;
  freightDisplayId?: number | null;
  freightRoute: string;
  companyId: string;
  companyName: string;
  cargoNumber: string;
  description: string;
  cargoType: string;
  weight: number;
  volume: number;
  unitCount: number;
  merchandiseValue: number;
  origin: string;
  destination: string;
  status: CargoStatus;
  scheduledDate: string;
  deliveredAt: string;
  notes: string;
};
