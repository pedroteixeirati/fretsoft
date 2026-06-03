export interface Provider {
  id: string;
  displayId?: number;
  name: string;
  type: string;
  usageType?: 'operational' | 'financial' | 'both';
  status: string;
  contact: string;
  email: string;
  address: string;
}
