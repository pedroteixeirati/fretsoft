import React from 'react';
import { Filter, Search } from 'lucide-react';
import CustomSelect from '../../../components/CustomSelect';

interface VehiclesFiltersProps {
  searchTerm: string;
  typeFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function VehiclesFilters({
  searchTerm,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeChange,
  onStatusChange,
}: VehiclesFiltersProps) {
  return (
    <div className="flex flex-1 flex-col md:flex-row gap-4">
      <div className="flex-1 bg-surface-container-lowest rounded-xl p-2 flex items-center shadow-sm focus-within:shadow-md transition-shadow">
        <Search className="w-5 h-5 text-outline ml-3" />
        <input
          type="text"
          placeholder="Buscar por placa, modelo ou motorista..."
          className="w-full border-none focus:ring-0 bg-transparent text-on-surface text-sm py-2 px-4 placeholder:text-outline/60"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <div className="h-6 w-px bg-outline/20 mx-2" />
        <div className="flex items-center gap-2 px-2">
          <CustomSelect
            value={typeFilter}
            onChange={onTypeChange}
            variant="inline"
            options={[
              { value: 'all', label: 'Todos os tipos' },
              { value: 'Carga Pesada', label: 'Carga Pesada' },
              { value: 'Longo Percurso', label: 'Longo Percurso' },
              { value: 'Utilitario', label: 'Utilitario' },
              { value: 'Executivo', label: 'Executivo' },
            ]}
          />
          <div className="h-6 w-px bg-outline/20 mx-2" />
          <CustomSelect
            value={statusFilter}
            onChange={onStatusChange}
            variant="inline"
            options={[
              { value: 'all', label: 'Todos os status' },
              { value: 'active', label: 'Ativo' },
              { value: 'maintenance', label: 'Manutencao' },
              { value: 'alert', label: 'Alerta' },
            ]}
          />
          <Filter className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
