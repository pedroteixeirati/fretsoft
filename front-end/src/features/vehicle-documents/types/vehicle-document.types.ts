export type VehicleDocumentType =
  | 'ipva'
  | 'licenciamento'
  | 'tacografo'
  | 'extintor'
  | 'seguro'
  | 'inspecao'
  | 'outro';

export type VehicleDocumentStatus = 'active' | 'archived';

export interface VehicleDocument {
  id: string;
  displayId?: number;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  documentType: VehicleDocumentType;
  identifier: string;
  amount: number | null;
  dueDate: string;
  status: VehicleDocumentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const vehicleDocumentTypeLabels: Record<VehicleDocumentType, string> = {
  ipva: 'IPVA',
  licenciamento: 'Licenciamento',
  tacografo: 'Tacografo',
  extintor: 'Extintor',
  seguro: 'Seguro',
  inspecao: 'Inspecao',
  outro: 'Outro',
};

export type VehicleDocumentDueState = 'expired' | 'expiring' | 'ok';

export const EXPIRING_WINDOW_DAYS = 30;

export function getVehicleDocumentDueState(dueDate: string, referenceDate = new Date()): VehicleDocumentDueState {
  const due = new Date(`${dueDate}T00:00:00`);
  const reference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const diffDays = Math.floor((due.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= EXPIRING_WINDOW_DAYS) return 'expiring';
  return 'ok';
}

export const vehicleDocumentDueStateLabels: Record<VehicleDocumentDueState, string> = {
  expired: 'Vencido',
  expiring: 'A vencer',
  ok: 'Em dia',
};
