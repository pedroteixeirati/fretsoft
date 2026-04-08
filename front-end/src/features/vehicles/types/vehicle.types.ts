export interface Vehicle {
  id: string;
  displayId?: number;
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
