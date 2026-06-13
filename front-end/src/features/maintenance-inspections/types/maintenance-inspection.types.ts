export type MaintenanceInspectionStatus = 'scheduled' | 'completed';
export type MaintenanceInspectionResult = 'ok' | 'attention' | 'na';

export interface MaintenanceInspectionItem {
  id?: string;
  label: string;
  result: MaintenanceInspectionResult;
  observation: string;
}

export interface MaintenanceInspection {
  id: string;
  displayId?: number;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  status: MaintenanceInspectionStatus;
  inspectedOn: string;
  odometer: number | null;
  mechanicName: string;
  nextDueOn: string;
  nextDueKm: number | null;
  notes: string;
  items: MaintenanceInspectionItem[];
  attentionCount: number;
  okCount: number;
  createdAt: string;
  updatedAt: string;
}

export const maintenanceInspectionStatusLabels: Record<MaintenanceInspectionStatus, string> = {
  scheduled: 'Agendada',
  completed: 'Concluida',
};

export const maintenanceInspectionResultLabels: Record<MaintenanceInspectionResult, string> = {
  ok: 'OK',
  attention: 'Atencao',
  na: 'N/A',
};

// Checklist preventivo padrao da frota (base: aba PREVENCAO da planilha do cliente).
// Generico para qualquer transportadora; o usuario pode adicionar/remover itens por inspecao.
export const defaultPreventiveChecklist: string[] = [
  'Conferir aperto de caixa',
  'Suporte do motor dianteiro e traseiro',
  'Setor de direcao (folga e vazamento)',
  'Mangueiras da direcao hidraulica',
  'Motor de arranque',
  'Correia dentada / acessorios',
  'Alavanca e trambulador de marcha',
  'Ponteiras / terminais de direcao',
  'Cardan, cruzeta e rolamentos',
  'Lubrificacao geral',
  'Nivel de oleo do motor',
  'Nivel de agua / arrefecimento',
  'Lonas / pastilhas de freio dianteiras',
  'Lonas / pastilhas de freio traseiras',
  'Oleo de caixa e diferencial',
  'Oleo hidraulico',
  'Pneus e calibragem',
  'Iluminacao e sinalizacao',
];
