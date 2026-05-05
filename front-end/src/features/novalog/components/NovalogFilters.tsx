import React from 'react';
import { Filter, Search } from 'lucide-react';
import Input from '../../../shared/ui/Input';

interface NovalogFiltersProps {
  searchTerm: string;
  originFilter: string;
  destinationFilter: string;
  fuelStationFilter: string;
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onOriginFilterChange: (value: string) => void;
  onDestinationFilterChange: (value: string) => void;
  onFuelStationFilterChange: (value: string) => void;
}

export default function NovalogFilters({
  searchTerm,
  originFilter,
  destinationFilter,
  fuelStationFilter,
  filteredCount,
  totalCount,
  onSearchChange,
  onOriginFilterChange,
  onDestinationFilterChange,
  onFuelStationFilterChange,
}: NovalogFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por ID ou intervalo"
          leftIcon={<Search className="h-4 w-4" />}
          containerClassName="min-w-0"
        />
        <Input
          value={originFilter}
          onChange={(event) => onOriginFilterChange(event.target.value)}
          placeholder="Filtrar por mineradora"
          leftIcon={<Filter className="h-4 w-4" />}
          containerClassName="min-w-0"
        />
        <Input
          value={destinationFilter}
          onChange={(event) => onDestinationFilterChange(event.target.value)}
          placeholder="Filtrar por siderúrgica"
          leftIcon={<Filter className="h-4 w-4" />}
          containerClassName="min-w-0"
        />
        <Input
          value={fuelStationFilter}
          onChange={(event) => onFuelStationFilterChange(event.target.value)}
          placeholder="Filtrar por posto"
          leftIcon={<Filter className="h-4 w-4" />}
          containerClassName="min-w-0"
        />
      </div>
      <div className="text-sm font-semibold text-on-surface-variant">
        Mostrando <span className="text-primary">{filteredCount}</span> de {totalCount} lançamento(s)
      </div>
    </div>
  );
}
