import React from 'react';
import { Filter, Search } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';
import { Payable } from '../types/payable.types';

interface PayablesFiltersProps {
  searchTerm: string;
  statusFilter: 'all' | Payable['status'];
  referenceMonthFilter: string;
  referenceMonthOptions: string[];
  invoiceFilter: 'all' | 'with_invoice' | 'missing';
  showNovalogFilters: boolean;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'all' | Payable['status']) => void;
  onReferenceMonthChange: (value: string) => void;
  onInvoiceFilterChange: (value: 'all' | 'with_invoice' | 'missing') => void;
}

export default function PayablesFilters({
  searchTerm,
  statusFilter,
  referenceMonthFilter,
  referenceMonthOptions,
  invoiceFilter,
  showNovalogFilters,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onReferenceMonthChange,
  onInvoiceFilterChange,
}: PayablesFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/50 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar conta, fornecedor ou veiculo..."
            className="min-w-[260px] rounded-full bg-surface py-3 pl-10 pr-4 text-sm font-medium text-on-surface outline-none ring-1 ring-primary/5 transition focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        {showNovalogFilters ? (
          <>
            <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 ring-1 ring-primary/5">
              <CustomSelect
                value={referenceMonthFilter}
                onChange={onReferenceMonthChange}
                variant="inline"
                options={[
                  { value: 'all', label: 'Todas as competencias' },
                  ...referenceMonthOptions.map((month) => ({ value: month, label: month })),
                ]}
              />
            </div>

            <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 ring-1 ring-primary/5">
              <CustomSelect
                value={invoiceFilter}
                onChange={(value) => onInvoiceFilterChange(value as 'all' | 'with_invoice' | 'missing')}
                variant="inline"
                options={[
                  { value: 'all', label: 'Todas as NFs' },
                  { value: 'with_invoice', label: 'Com NF' },
                  { value: 'missing', label: 'Sem nota' },
                ]}
              />
            </div>
          </>
        ) : null}

        <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 ring-1 ring-primary/5">
          <CustomSelect
            value={statusFilter}
            onChange={(value) => onStatusChange(value as 'all' | Payable['status'])}
            variant="inline"
            options={[
              { value: 'all', label: 'Todos os status' },
              { value: 'open', label: 'Em aberto' },
              { value: 'paid', label: 'Paga' },
              { value: 'overdue', label: 'Em atraso' },
              { value: 'canceled', label: 'Cancelada' },
            ]}
          />
          <Filter className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="text-sm font-semibold text-on-surface-variant">
        Mostrando <span className="text-primary">{filteredCount}</span> de {totalCount} contas a pagar
      </div>
    </div>
  );
}
