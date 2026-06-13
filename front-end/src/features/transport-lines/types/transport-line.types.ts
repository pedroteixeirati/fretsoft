export type TransportLineShift = 'manha' | 'tarde' | 'noite' | 'integral';

export interface TransportLine {
  id: string;
  displayId?: number;
  lineCode: string;
  clientName: string;
  companyId: string;
  companyName: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  shift: TransportLineShift;
  departureTime: string;
  origin: string;
  destination: string;
  side: string;
  seats: number | null;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const shiftLabels: Record<TransportLineShift, string> = {
  manha: 'Manha',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
};
