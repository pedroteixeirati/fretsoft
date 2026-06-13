import React from 'react';
import { Filter, Search } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

interface RecurringPayablesFiltersProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function RecurringPayablesFilters({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: RecurringPayablesFiltersProps) {
  return (
    <div className="flex flex-1 flex-col md:flex-row gap-4">
      <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
        <Search className="w-5 h-5 text-outline ml-3" />
        <input
          type="text"
          placeholder="Buscar por descricao ou fornecedor..."
          className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="h-6 w-px bg-outline/20 mx-2" />
        <div className="flex items-center gap-2 px-2">
          <CustomSelect
            value={statusFilter}
            onChange={onStatusChange}
            variant="inline"
            options={[
              { value: 'all', label: 'Todas as situacoes' },
              { value: 'active', label: 'Ativas' },
              { value: 'paused', label: 'Pausadas' },
            ]}
          />
          <Filter className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
