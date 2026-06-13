export interface Company {
  id: string;
  displayId?: number;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  municipalRegistration: string;
  legalRepresentative: string;
  representativeCpf: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ibgeCode?: string;
  contractContact?: string;
  notes?: string;
  status: 'active' | 'inactive';
}
