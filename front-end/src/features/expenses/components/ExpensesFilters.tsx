import React from 'react';
import { Filter, Search } from 'lucide-react';

interface ExpensesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
}

export default function ExpensesFilters({
  searchTerm,
  onSearchChange,
  filteredCount,
  totalCount,
}: ExpensesFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/50 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Buscar custo operacional..."
            className="min-w-[220px] rounded-full border-none bg-surface py-2 pl-10 pr-4 text-sm font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <button className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant">
          <Filter className="h-5 w-5" />
        </button>
      </div>
      <div className="text-sm font-semibold text-on-surface-variant">
        Mostrando <span className="text-primary">{filteredCount}</span> de {totalCount} custos operacionais
      </div>
    </div>
  );
}
