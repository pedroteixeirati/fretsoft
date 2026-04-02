import { Vehicle, Expense, Provider } from './types';

export const VEHICLES: Vehicle[] = [
  {
    id: 'FLT-2091',
    name: 'Scania R 450',
    plate: 'HHK-3073',
    driver: 'Carlos Alberto',
    type: 'Carga Pesada',
    km: 124500,
    nextMaintenance: '22 Out',
    status: 'active',
    efficiency: 82,
    fuelType: 'Diesel',
    license: 'HHK-3073',
    healthScore: 92,
    image: 'https://images.unsplash.com/photo-1586191121278-200df1d4d659?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'FLT-5542',
    name: 'Toyota Hilux',
    plate: 'PUY-2910',
    driver: 'Amanda Silva',
    type: 'Operações',
    km: 45210,
    nextMaintenance: '15 Nov',
    status: 'active',
    efficiency: 88,
    fuelType: 'Híbrido',
    license: 'PUY-2910',
    healthScore: 98,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'FLT-1180',
    name: 'Volvo FH 540',
    plate: 'ABC-1234',
    driver: 'João Pereira',
    type: 'Longo Percurso',
    km: 312000,
    nextMaintenance: '30 Out',
    status: 'maintenance',
    efficiency: 75,
    fuelType: 'Diesel',
    license: 'ABC-1234',
    healthScore: 85,
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=400'
  }
];

export const EXPENSES: Expense[] = [
  {
    id: 'EXP-001',
    date: '15/10/2023',
    time: '08:45 AM',
    vehicleId: 'FLT-2091',
    vehicleName: 'VOLVO-FH-440',
    provider: 'Shell Posto Matriz',
    category: 'Combustível (Diesel)',
    quantity: '350.00 L',
    amount: 2065.00,
    odometer: '142.350 km',
    status: 'approved',
    observations: 'Abastecimento completo para viagem regional.'
  },
  {
    id: 'EXP-002',
    date: '14/10/2023',
    time: '02:30 PM',
    vehicleId: 'FLT-5542',
    vehicleName: 'SCANIA-R-450',
    provider: 'Centro de Serviço Volvo',
    category: 'Manutenção',
    quantity: '1.00 Unidade',
    amount: 4800.00,
    odometer: '98.400 km',
    status: 'approved',
    observations: 'Revisão periódica e troca de óleo.'
  },
  {
    id: 'EXP-003',
    date: '12/10/2023',
    time: '11:15 AM',
    vehicleId: 'FLT-1180',
    vehicleName: 'MB-ACTROS-265',
    provider: 'Michelin Pneus SP',
    category: 'Pneus',
    quantity: '2.00 Unidades',
    amount: 3500.00,
    odometer: '215.000 km',
    status: 'review',
    observations: 'Substituição de pneus dianteiros.'
  }
];

export const PROVIDERS: Provider[] = [
  { id: 'P-001', name: 'Oficina Central Ltda', type: 'Oficina', rating: 4.8, status: 'Parceiro', contact: '+55 11 98765-4321', email: 'contato@oficinacentral.com', address: 'Rua das Oficinas, 123, São Paulo - SP' },
  { id: 'P-002', name: 'Auto Posto Estrela', type: 'Combustível', rating: 4.5, status: 'Parceiro', contact: '+55 11 91234-5678', email: 'posto@estrela.com', address: 'Av. das Estrelas, 456, São Paulo - SP' },
  { id: 'P-003', name: 'Michelin Pneus SP', type: 'Pneus', rating: 4.9, status: 'Parceiro', contact: '+55 11 99999-8888', email: 'vendas@michelinsp.com', address: 'Rua dos Pneus, 789, São Paulo - SP' },
  { id: 'P-004', name: 'Centro de Serviço Volvo', type: 'Manutenção', rating: 4.7, status: 'Parceiro', contact: '+55 11 97777-6666', email: 'suporte@volvosp.com', address: 'Av. Volvo, 101, São Paulo - SP' },
  { id: 'P-005', name: 'Shell Posto Matriz', type: 'Combustível', rating: 4.6, status: 'Parceiro', contact: '+55 11 95555-4444', email: 'matriz@shellpostos.com', address: 'Rua Shell, 202, São Paulo - SP' }
];
