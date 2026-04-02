export type NavItem = 'dashboard' | 'expenses' | 'vehicles' | 'suppliers' | 'reports' | 'settings' | 'support';

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  driver: string;
  type: string;
  km: number;
  nextMaintenance: string;
  status: 'active' | 'maintenance' | 'alert';
  efficiency?: number;
  fuelType?: string;
  license?: string;
  healthScore?: number;
  image?: string;
}

export interface Expense {
  id: string;
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
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  rating: number;
  status: string;
  contact: string;
  email: string;
  address: string;
}
