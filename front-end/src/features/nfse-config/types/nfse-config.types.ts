export interface NfseConfig {
  serviceCode: string;
  serviceListItem: string;
  cnaeCode: string;
  issRate: number | null;
  issRetained: boolean;
  specialRegime: string;
  municipalIncidenceIbge: string;
  defaultServiceDescription: string;
  enabled: boolean;
  configured: boolean;
  updatedAt?: string;
}

export interface NfseConfigPayload {
  serviceCode: string;
  serviceListItem: string;
  cnaeCode: string;
  issRate: number | null;
  issRetained: boolean;
  specialRegime: string;
  municipalIncidenceIbge: string;
  defaultServiceDescription: string;
  enabled: boolean;
}
