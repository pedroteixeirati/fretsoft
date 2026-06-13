export interface Driver {
  id: string;
  displayId?: number;
  name: string;
  cpf: string;
  cnhNumber: string;
  cnhCategory: string;
  cnhExpiresOn: string;
  phone: string;
  status: 'active' | 'inactive';
  notes: string;
  createdAt: string;
  updatedAt: string;
}
