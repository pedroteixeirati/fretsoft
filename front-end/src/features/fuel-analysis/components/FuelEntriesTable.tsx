import React from 'react';
import { VehicleFuelSummary } from '../utils/fuel-analysis';

interface FuelEntriesTableProps {
  summary: VehicleFuelSummary;
}

function formatDate(value: string) {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function FuelEntriesTable({ summary }: FuelEntriesTableProps) {
  return (
    <div className="rounded-xl bg-surface-container-low p-1 lg:col-span-12">
      <div className="rounded-lg bg-surface-container-lowest p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold text-on-surface">
            Abastecimentos — {summary.vehicleName || 'Veiculo'}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Posto / Fornecedor</th>
                <th className="px-3 py-3 text-right">Litros</th>
                <th className="px-3 py-3 text-right">Odometro</th>
                <th className="px-3 py-3 text-right">Km rodado</th>
                <th className="px-3 py-3 text-right">Media km/l</th>
                <th className="px-3 py-3 text-right">Custo/km</th>
                <th className="px-3 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {summary.entries.map((entry) => (
                <tr key={entry.expenseId} className="border-b border-outline-variant/10 transition-colors hover:bg-primary-fixed-dim/10">
                  <td className="px-3 py-3 font-medium text-on-surface">{formatDate(entry.date)}</td>
                  <td className="px-3 py-3 text-on-surface-variant">{entry.provider || '—'}</td>
                  <td className="px-3 py-3 text-right text-on-surface">{entry.liters ? formatNumber(entry.liters, 2) : '—'}</td>
                  <td className="px-3 py-3 text-right text-on-surface-variant">
                    {entry.odometer !== null ? formatNumber(entry.odometer) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-on-surface">
                    {entry.kmRun !== null ? formatNumber(entry.kmRun) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-bold text-on-surface">
                    {entry.kmPerLiter !== null ? formatNumber(entry.kmPerLiter, 2) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-on-surface-variant">
                    {entry.costPerKm !== null ? formatCurrency(entry.costPerKm) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-on-surface">{formatCurrency(entry.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-on-surface-variant">
          O km rodado e a media km/l sao calculados pela diferenca de odometro entre abastecimentos consecutivos. O primeiro abastecimento e lancamentos sem odometro nao entram na media.
        </p>
      </div>
    </div>
  );
}
