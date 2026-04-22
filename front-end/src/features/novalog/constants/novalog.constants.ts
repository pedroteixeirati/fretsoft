import { Layers3, Pickaxe, Truck, Wallet } from 'lucide-react';
import { NovalogEntry, NovalogKpi, NovalogOption, NovalogStandardEntryFormData, NovalogWeekOption } from '../types/novalog.types';

export const novalogWeekOptions: NovalogWeekOption[] = [
  { id: 1, label: '1a semana', helperText: 'Fechamento inicial do periodo' },
  { id: 2, label: '2a semana', helperText: 'Operacao intermediaria' },
  { id: 3, label: '3a semana', helperText: 'Maior volume de lancamentos' },
  { id: 4, label: '4a semana', helperText: 'Consolidacao semanal' },
];

export const novalogInitialKpis: Array<NovalogKpi & { iconName: 'Truck' | 'Wallet' | 'Layers3' }> = [
  {
    label: 'Peso total',
    value: '0 t',
    helperText: 'Soma dos pesos registrados na operacao',
    iconName: 'Truck',
  },
  {
    label: 'Total empresa',
    value: 'R$ 0,00',
    helperText: 'Resultado bruto da empresa no periodo',
    iconName: 'Wallet',
  },
  {
    label: 'Total terceiro',
    value: 'R$ 0,00',
    helperText: 'Base de calculo do terceiro',
    iconName: 'Layers3',
  },
];

export const novalogKpiIcons = {
  Truck,
  Wallet,
  Layers3,
  Pickaxe,
};

export const novalogMockEntries: NovalogEntry[] = [
  {
    id: 'novalog-entry-1',
    displayId: 1,
    weekNumber: 1,
    operationDate: '2026-04-03',
    originName: 'Minerbrasil',
    destinationName: 'Gerdau',
    weight: 36.25,
    companyRatePerTon: 11,
    companyGrossAmount: 398.75,
    aggregatedRatePerTon: 10,
    aggregatedGrossAmount: 362.5,
    ticketNumber: '770',
    fuelStationName: 'Campeao',
    entryMode: 'standard',
  },
  {
    id: 'novalog-entry-2',
    displayId: 2,
    weekNumber: 1,
    operationDate: '2026-04-03',
    originName: 'Minerbrasil',
    destinationName: 'Viena',
    weight: 28.84,
    companyRatePerTon: 50,
    companyGrossAmount: 1442,
    aggregatedRatePerTon: 45,
    aggregatedGrossAmount: 1297.8,
    ticketNumber: '36270',
    fuelStationName: 'Campeao',
    entryMode: 'batch',
  },
  {
    id: 'novalog-entry-3',
    displayId: 3,
    weekNumber: 1,
    operationDate: '2026-04-04',
    originName: 'Cedro',
    destinationName: 'Cosimat',
    weight: 33.97,
    companyRatePerTon: 79,
    companyGrossAmount: 2683.63,
    aggregatedRatePerTon: 70,
    aggregatedGrossAmount: 2377.9,
    ticketNumber: '154230',
    fuelStationName: 'Santa Helena',
    entryMode: 'batch',
  },
  {
    id: 'novalog-entry-4',
    displayId: 4,
    weekNumber: 2,
    operationDate: '2026-04-10',
    originName: 'Extrativa',
    destinationName: 'Minasfer',
    weight: 31.15,
    companyRatePerTon: 48,
    companyGrossAmount: 1495.2,
    aggregatedRatePerTon: 42,
    aggregatedGrossAmount: 1308.3,
    ticketNumber: '40218',
    fuelStationName: 'Campeao',
    entryMode: 'standard',
  },
];

export const novalogDestinationOptions: NovalogOption[] = [
  { value: 'Gerdau', label: 'Gerdau' },
  { value: 'Viena', label: 'Viena' },
  { value: 'Cosimat', label: 'Cosimat' },
  { value: 'Multifer', label: 'Multifer' },
  { value: 'Minasfer', label: 'Minasfer' },
];

export const novalogFuelStationOptions: NovalogOption[] = [
  { value: 'Campeao', label: 'Posto Campeao' },
  { value: 'Santa Helena', label: 'Posto Santa Helena' },
  { value: 'Gauchao', label: 'Posto Gauchao' },

];

export function getTodayInputDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function defaultNovalogStandardEntryFormData(): NovalogStandardEntryFormData {
  return {
    operationDate: getTodayInputDate(),
    originName: '',
    destinationName: '',
    weight: '',
    companyRatePerTon: '',
    aggregatedRatePerTon: '',
    ticketNumber: '',
    fuelStationName: '',
  };
}
