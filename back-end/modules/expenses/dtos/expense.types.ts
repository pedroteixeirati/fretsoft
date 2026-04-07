export type ExpenseInput = {
  date: string;
  time: string;
  vehicleId: string;
  provider: string;
  category: string;
  quantity?: string | number;
  amount: string | number;
  odometer?: string | number;
  status: 'approved' | 'review' | 'pending';
  observations?: string;
};

export type ExpensePayload = {
  displayId?: number;
  date: string;
  time: string;
  vehicleId: string;
  vehicleName: string;
  provider: string;
  category: string;
  quantity: string;
  amount: number;
  odometer: string;
  status: 'approved' | 'review' | 'pending';
  observations: string;
};
