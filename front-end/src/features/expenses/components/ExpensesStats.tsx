import React from 'react';
import { AlertTriangle, Truck, Wallet, Wrench } from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

interface ExpensesStatsProps {
  totalAmount: number;
  fuelAmount: number;
  maintenanceAmount: number;
  pendingCount: number;
}

export default function ExpensesStats({
  totalAmount,
  fuelAmount,
  maintenanceAmount,
  pendingCount,
}: ExpensesStatsProps) {
  return (
    <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Custos filtrados" value={`R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wallet} tone="primary" />
      <KpiCard label="Combustivel" value={`R$ ${fuelAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Truck} tone="secondary" />
      <KpiCard label="Manutencao" value={`R$ ${maintenanceAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={Wrench} tone="tertiary" />
      <KpiCard label="Pendentes" value={`${pendingCount} lancamento(s)`} icon={AlertTriangle} tone="danger" />
    </div>
  );
}
