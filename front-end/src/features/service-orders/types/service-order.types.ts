export type ServiceOrderStatus = 'open' | 'in_progress' | 'completed' | 'canceled';
export type ServiceOrderItemType = 'part' | 'labor';

export interface ServiceOrderItem {
  id?: string;
  itemType: ServiceOrderItemType;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  supplierName: string;
  notes: string;
}

export interface ServiceOrder {
  id: string;
  displayId?: number;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  status: ServiceOrderStatus;
  openedOn: string;
  closedOn: string;
  odometer: number | null;
  providerName: string;
  description: string;
  totalAmount: number;
  notes: string;
  items: ServiceOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export const serviceOrderStatusLabels: Record<ServiceOrderStatus, string> = {
  open: 'Aberta',
  in_progress: 'Em andamento',
  completed: 'Concluida',
  canceled: 'Cancelada',
};

export const serviceOrderItemTypeLabels: Record<ServiceOrderItemType, string> = {
  part: 'Peca',
  labor: 'Mao de obra',
};
